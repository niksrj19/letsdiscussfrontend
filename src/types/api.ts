export type User = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  user: User;
};

export type Source = {
  id: string;
  url: string;
  title: string;
  indexedAt: string;
  chunks: number;
};

export type Citation = {
  label: string;
  url: string;
  title: string;
  chunkIndexes: number[];
};

export type ChatMessage = {
  question: string;
  answer: string;
  sources: Citation[];
  time: string;
};
