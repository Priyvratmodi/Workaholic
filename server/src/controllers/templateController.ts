import { Request, Response } from 'express';
import { PROJECT_MANAGEMENT_TEMPLATE } from '@workaholic/shared';

export function getTemplates(_req: Request, res: Response) {
  res.json({
    templates: [PROJECT_MANAGEMENT_TEMPLATE],
  });
}
