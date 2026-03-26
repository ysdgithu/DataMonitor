// 认证路由
import { Router } from 'express';
import SysUser from '../sequelize/models/SysUser';
import SysRole from '../sequelize/models/SysRole';
import { generateToken, verifyPassword, hashPassword } from '../utils/jwt';
import { success, unauthorized, badRequest } from '../utils/response';
import { authMiddleware } from '../middleware/jwt';

const router = Router();

// 登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.json(badRequest('用户名和密码不能为空'));
        }

        const user = await SysUser.findOne({
            where: { username },
            include: [{ model: SysRole, as: 'role' }],
        });

        if (!user || user.isDeleted === 1) {
            return res.json(unauthorized('用户名或密码错误'));
        }

        if (user.status !== 1) {
            return res.json(unauthorized('账号已被禁用'));
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return res.json(unauthorized('用户名或密码错误'));
        }

        const token = generateToken({
            id: user.id,
            username: user.username,
            role: (user as any).role?.roleCode || 'operator',
            roleId: user.roleId,
        });

        res.json(success({ user: user.toJSON(), token }, '登录成功'));
    } catch (err: any) {
        res.json(badRequest(err.message));
    }
});

// 注册
router.post('/register', async (req, res) => {
    try {
        const { username, password, realName, roleId, phone } = req.body;
        if (!username || !password || !realName || !roleId) {
            return res.json(badRequest('请填写完整信息'));
        }

        const existing = await SysUser.findOne({ where: { username } });
        if (existing) {
            return res.json(badRequest('用户名已存在'));
        }

        const role = await SysRole.findByPk(roleId);
        if (!role) {
            return res.json(badRequest('角色不存在'));
        }

        const hashedPassword = await hashPassword(password);
        const user = await SysUser.create({
            username,
            password: hashedPassword,
            realName,
            roleId,
            phone,
            status: 1,
            isDeleted: 0,
        });

        res.json(success(user.toJSON(), '注册成功'));
    } catch (err: any) {
        res.json(badRequest(err.message));
    }
});

// 获取当前用户
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await SysUser.findByPk(req.user!.id, {
            include: [{ model: SysRole, as: 'role' }],
        });

        if (!user || user.isDeleted === 1) {
            return res.json(unauthorized('用户不存在'));
        }

        res.json(success(user.toJSON(), '获取成功'));
    } catch (err: any) {
        res.json(badRequest(err.message));
    }
});

// 修改密码
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.json(badRequest('请填写完整信息'));
        }

        const user = await SysUser.findByPk(req.user!.id);
        if (!user) return res.json(unauthorized('用户不存在'));

        const isValid = await verifyPassword(oldPassword, user.password);
        if (!isValid) return res.json(badRequest('原密码错误'));

        await user.update({ password: await hashPassword(newPassword) });
        res.json(success(null, '密码修改成功'));
    } catch (err: any) {
        res.json(badRequest(err.message));
    }
});

export default router;
