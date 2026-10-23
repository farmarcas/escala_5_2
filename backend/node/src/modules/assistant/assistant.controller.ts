import type { Request, Response } from 'express';
import type { z } from 'zod';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/logger.js';
import { getPrincipal } from '../../shared/middlewares/require-session.js';
import { readValidated } from '../../shared/middlewares/validate.js';
import type { ScalesService } from '../scales/scales.service.js';
import type { ModelClient } from './assistant.model-client.js';
import type { analyzeRequestSchema } from './assistant.schemas.js';
import { runAnalysis, type AnalysisEvent } from './assistant.service.js';

type Deps = { scales: ScalesService; model: ModelClient | null };

export const makeAssistantController = ({ scales, model }: Deps) => ({
  status(_req: Request, res: Response) {
    res.json({ enabled: model !== null });
  },

  async analyze(req: Request, res: Response) {
    if (!model) {
      throw new AppError(
        'A IA está indisponível agora. O painel continua funcionando.',
        503,
        'ASSISTANT_DISABLED',
      );
    }
    const { body } = readValidated<z.infer<typeof analyzeRequestSchema>>(res);
    const principal = getPrincipal(res);
    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      ...base
    } = await scales.getById(principal.groupId, body.storeId);
    const store = {
      ...base,
      ...(body.regime && { taxRegime: body.regime }),
      rules: {
        ...base.rules,
        ...(body.provisions !== undefined && { provisions: body.provisions }),
      },
    };

    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    const controller = new AbortController();
    res.on('close', () => controller.abort());
    const emit = (event: AnalysisEvent) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const started = Date.now();
    const report = await runAnalysis({
      store,
      scenario: body.scenario,
      prompt: body.prompt,
      history: body.history,
      model,
      emit,
      signal: controller.signal,
    });
    // Só metadados: nada do texto da conversa nem dos dados da loja vai para o log.
    logger.info(
      {
        assistant: {
          outcome: report.outcome,
          rounds: report.rounds,
          tools: report.tools,
          toolErrors: report.toolErrors,
          usage: report.usage,
          ms: Date.now() - started,
          promptChars: body.prompt?.length ?? 0,
        },
      },
      'assistant analysis',
    );
    if (!res.writableEnded) res.end();
  },
});
