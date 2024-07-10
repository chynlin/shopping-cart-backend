const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, User } = require('../models');
const auth = require('../middleware/admin');
const createResponse = require('../utils/responseHelper');

// 获取订单列表
router.post('/list', auth, async (req, res) => {
  const page = parseInt(req.body.page) || 1;
  const pageSize = parseInt(req.body.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    const { count, rows: orders } = await Order.findAndCountAll({
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name'] },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price'],
            },
          ],
        },
      ],
      limit: pageSize,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });
    const dataWithTimestamp = orders.map((order) => {
      return {
        ...order.toJSON(),
        createdAt: new Date(order.createdAt).getTime(),
        updatedAt: new Date(order.updatedAt).getTime(),
      };
    });
    res.json(
      createResponse(dataWithTimestamp, {
        page: page,
        pageSize: pageSize,
        total: count,
      })
    );
  } catch (error) {
    res.json(createResponse(null, null, true, error.message));
  }
});

// 获取订单详情
router.post('/info', auth, async (req, res) => {
  const { id } = req.body;

  try {
    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name'] },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price'],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.json(createResponse(null, null, true, 'Order not found'));
    }

    res.json(createResponse(order));
  } catch (error) {
    res.json(createResponse(null, null, true, error.message));
  }
});

// 新增订单
router.post('/create', auth, async (req, res) => {
  const { customer_id, items, status, logisticsCompany, trackingNumber } =
    req.body;
  const parsedItems = JSON.parse(items);
  if (
    !customer_id ||
    !parsedItems ||
    !Array.isArray(parsedItems) ||
    parsedItems.length === 0
  ) {
    return res.json(createResponse(null, null, true, 'Invalid order data'));
  }

  try {
    let totalAmount = 0;
    for (const item of parsedItems) {
      totalAmount += item.price * item.quantity;
    }
    const order = await Order.create({
      customer_id,
      totalAmount,
      status,
      logisticsCompany,
      trackingNumber,
    });
    if (!order) {
      throw new Error('Order creation failed');
    }
    const orderItems = parsedItems.map((item) => ({
      order_id: order.orderNumber,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));
    await OrderItem.bulkCreate(orderItems);
    res.json(createResponse(order));
  } catch (error) {
    console.error('Error during order creation:', error);
    res.json(createResponse(null, null, true, error.message));
  }
});

// 修改订单
router.post('/update', auth, async (req, res) => {
  const {
    id,
    customer_id,
    items,
    totalAmount,
    status,
    logisticsCompany,
    trackingNumber,
  } = req.body;

  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return res
        .status(404)
        .json(createResponse(null, null, true, 'Order not found'));
    }

    order.customer_id = customer_id || order.customer_id;
    order.totalAmount = totalAmount || order.totalAmount;
    order.status = status || order.status;
    order.logisticsCompany = logisticsCompany || order.logisticsCompany;
    order.trackingNumber = trackingNumber || order.trackingNumber;

    await order.save();

    if (items && Array.isArray(items) && items.length > 0) {
      await OrderItem.destroy({ where: { order_id: id } });
      const orderItems = items.map((item) => ({
        order_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));
      await OrderItem.bulkCreate(orderItems);
    }

    res.json(createResponse(order));
  } catch (error) {
    res.status(500).json(createResponse(null, null, true, error.message));
  }
});

// 删除订单
router.post('/delete', auth, async (req, res) => {
  const { id } = req.body;

  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return res
        .status(404)
        .json(createResponse(null, null, true, 'Order not found'));
    }

    await order.destroy();

    res.json(createResponse(null, null, false, 'Order deleted successfully'));
  } catch (error) {
    res.status(500).json(createResponse(null, null, true, error.message));
  }
});

// 更新订单状态
router.post('/update-status', auth, async (req, res) => {
  const { id, status } = req.body;

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res
        .status(404)
        .json(createResponse(null, null, true, 'Order not found'));
    }

    order.status = status;
    await order.save();

    res.json(createResponse(order));
  } catch (error) {
    res.status(500).json(createResponse(null, null, true, error.message));
  }
});

// 更新物流信息
router.post('/update-logistics', auth, async (req, res) => {
  const { id, logisticsCompany, trackingNumber } = req.body;

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res
        .status(404)
        .json(createResponse(null, null, true, 'Order not found'));
    }

    order.logisticsCompany = logisticsCompany;
    order.trackingNumber = trackingNumber;
    await order.save();

    res.json(createResponse(order));
  } catch (error) {
    res.status(500).json(createResponse(null, null, true, error.message));
  }
});

module.exports = router;
