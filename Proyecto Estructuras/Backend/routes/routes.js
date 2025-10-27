import { Router } from 'express';
import { getAllLigas } from '../controllers/ligas_controllers.js';

const router = Router();

router.get('/', getAllLigas);

export default router;