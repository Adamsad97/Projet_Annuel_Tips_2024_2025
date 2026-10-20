import type { Response, NextFunction, Router } from 'express';
import express from 'express';
import { messagingService } from './messaging.service';
import { sendMessageSchema, editMessageSchema } from './messaging.validation';
import { validateSchema } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { parseIdParam } from '../../utils/params.util';
import { ROUTES } from '../../config/routes';
import type { RequestWithUser } from '../../types/auth.types';

export class MessagingController {
  listConversations = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await messagingService.listConversations(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getConversation = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const id = parseIdParam(req.params.id, 'conversation id');
      const data = await messagingService.getConversation(id, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getConversationWith = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const otherUserId = parseIdParam(req.params.userId, 'user id');
      const data = await messagingService.getConversationWith(req.user!.id, otherUserId);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  sendMessage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await messagingService.sendMessage(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  editMessage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const id = parseIdParam(req.params.id, 'message id');
      const data = await messagingService.editMessage(id, req.user!.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  listBlockedUsers = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const data = await messagingService.listBlockedUsers(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  blockUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const id = parseIdParam(req.params.id, 'user id');
      await messagingService.blockUser(req.user!.id, id);
      res.status(200).json({ success: true, message: 'user blocked' });
    } catch (e) {
      next(e);
    }
  };

  unblockUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const id = parseIdParam(req.params.id, 'user id');
      await messagingService.unblockUser(req.user!.id, id);
      res.status(200).json({ success: true, message: 'user unblocked' });
    } catch (e) {
      next(e);
    }
  };

  build(): Router {
    const router = express.Router();
    router.get(ROUTES.messaging.conversations, requireAuth, this.listConversations);
    router.get(ROUTES.messaging.conversationWith, requireAuth, this.getConversationWith);
    router.get(ROUTES.messaging.conversation, requireAuth, this.getConversation);
    router.post(
      ROUTES.messaging.messages,
      requireAuth,
      validateSchema(sendMessageSchema),
      this.sendMessage,
    );
    router.patch(
      ROUTES.messaging.message,
      requireAuth,
      validateSchema(editMessageSchema),
      this.editMessage,
    );
    router.get(ROUTES.messaging.blocks, requireAuth, this.listBlockedUsers);
    router.post(ROUTES.messaging.block, requireAuth, this.blockUser);
    router.delete(ROUTES.messaging.block, requireAuth, this.unblockUser);
    return router;
  }
}
