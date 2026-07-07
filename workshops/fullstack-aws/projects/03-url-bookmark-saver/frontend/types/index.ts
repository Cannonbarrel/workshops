export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export interface ApiError {
  error: string;
}
