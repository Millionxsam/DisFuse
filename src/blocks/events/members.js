import {
  createEventBlock,
  createEventVariable,
} from '../../functions/createEvent';
import { createRestrictions } from '../../functions/restrictions';

createEventBlock(
  'events_members_addRole',
  'When a member is given a role',
  '#FF4F4F',
  'guildMemberRoleAdd',
  ['member', 'role']
);

createEventVariable(
  'events_members_addRole_member',
  'member who was given a role',
  '#FF4F4F',
  'member',
  'member'
);

createEventVariable(
  'events_members_addRole_role',
  'added role',
  '#FF4F4F',
  'role',
  'role'
);

createEventBlock(
  'events_members_removeRole',
  'When a member is removed from a role',
  '#FF4F4F',
  'guildMemberRoleAdd',
  ['member', 'role']
);

createEventVariable(
  'events_members_removeRole_member',
  'member who was removed from a role',
  '#FF4F4F',
  'member',
  'member'
);

createEventVariable(
  'events_members_removeRole_role',
  'removed role',
  '#FF4F4F',
  'role',
  'role'
);

createRestrictions(
  ['events_members_addRole_member', 'events_members_addRole_role'],
  [
    {
      type: 'hasHat',
      blockTypes: ['events_members_addRole'],
      message:
        "This block must be in the 'When a member is given a role' event",
    },
  ]
);

createRestrictions(
  ['events_members_removeRole_member', 'events_members_removeRole_role'],
  [
    {
      type: 'hasHat',
      blockTypes: ['events_members_removeRole'],
      message:
        "This block must be in the 'When a member is removed from a role' event",
    },
  ]
);
