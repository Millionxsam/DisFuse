export const userCache: {
  user: object | null;
  allUsers: Array<object> | null;
  allStaff: Array<object> | null;
  isStaff: boolean;
  projects: Array<object> | null;
  explore: Array<object> | null;
  favorites: Array<object> | null;
  stats: { projects:number, users:number } | null;
} = {
  user: null,
  allUsers: null,
  allStaff: null,
  isStaff: false,
  projects: null,
  explore: null,
  favorites: null,
  stats: null
};
