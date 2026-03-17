import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    onUnauthorized?: () => void;
  }
}
