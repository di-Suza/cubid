import { requiredStringBody } from '../../../shared/validators/common.js';

export const updateProfileValidators = [requiredStringBody('name', 80)];
