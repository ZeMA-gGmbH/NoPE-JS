import { SPLITCHAR } from "./objectMethods";

export function getPropertyPath(identifier: string, name: string) {
  return `${identifier}${SPLITCHAR}properties${SPLITCHAR}${name}`;
}

export function isPropertyPathCorrect(identifier: string, path: string) {
  return path.startsWith(`${identifier}${SPLITCHAR}properties${SPLITCHAR}`);
}

export function getMethodPath(identifier: string, name: string) {
  return `${identifier}${SPLITCHAR}methods${SPLITCHAR}${name}`;
}

export function isMethodPathCorrect(identifier: string, path: string) {
  return path.startsWith(`${identifier}${SPLITCHAR}methods${SPLITCHAR}`);
}

export function getEmitterPath(identifier: string, name: string) {
  return `${identifier}${SPLITCHAR}events${SPLITCHAR}${name}`;
}

export function isEmitterPathCorrect(identifier: string, path: string) {
  return path.startsWith(`${identifier}${SPLITCHAR}events${SPLITCHAR}`);
}
