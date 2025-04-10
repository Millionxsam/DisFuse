export const userCache: {
  user: object | null;
  isStaff: boolean;
  projects: Array<object> | null;
  explore: Array<object> | null;
  favorites: Array<object> | null;
} = {
  user: null,
  isStaff: false,
  projects: null,
  explore: null,
  favorites: null
};
