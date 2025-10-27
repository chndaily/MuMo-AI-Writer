import { PromptFunction } from '../types';
import { createBuiltinFunctions } from './builtinFunctions';
import { createCustomFunctions } from './customFunctions';

export const promptAllFunctions: Record<string, PromptFunction> = {
  ...createBuiltinFunctions(),
  ...createCustomFunctions()
}