export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  created: string;
  inbox: Array<object>;
  favorites: Array<object>;
}

export const userCache: {
  user: object | null;
  isStaff: boolean;
  isAuthenticated: boolean;
  projects: Array<object> | null;
  explore: Array<object> | null;
} = {
  user: null,
  isStaff: false,
  isAuthenticated: false,
  projects: null,
  explore: null
};