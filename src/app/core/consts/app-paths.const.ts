import { AppPath } from "../types/app-path.type";

export const APP_PATHS = {
  home: {
    label: 'Home',
    path: ''
  },
  login: {
    label: 'Login',
    path: 'login'
  },
  admin: {
    label: 'Admin',
    path: 'administrativo'
  }
} as const satisfies Record<string, AppPath>;
