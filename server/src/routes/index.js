const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const departmentRoutes = require('./departmentRoutes');
const ideaRoutes = require('./ideaRoutes');
const criteriaWeightsRoutes = require('./criteriaWeightsRoutes');
const notificationRoutes = require('./notificationRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/ideas', ideaRoutes);
router.use('/criteria-weights', criteriaWeightsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-log', auditLogRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
