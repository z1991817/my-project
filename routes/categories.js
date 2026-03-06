const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// 获取所有启用的分类（用于下拉选择）
router.get('/enabled', categoryController.getAllEnabled);

// 获取分类列表
router.get('/', categoryController.list);

// 获取分类详情
router.get('/:id', categoryController.detail);

// 创建分类
router.post('/', categoryController.create);

// 更新分类
router.put('/:id', categoryController.update);

// 更新分类序号
router.put('/:id/sort', categoryController.updateSortOrder);

// 删除分类
router.delete('/:id', categoryController.delete);

module.exports = router;
