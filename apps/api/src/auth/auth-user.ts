export type AuthUser = {
  id: string;
  email: string;
};

export type AuthenticatedRequest = {
  user: AuthUser;
};
