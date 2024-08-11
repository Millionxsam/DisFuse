import { createRestrictions } from "../../functions/restrictions";
import {
    createEventBlock,
    createEventVariable,
} from "../../functions/createEvent";

createEventBlock(
    "events_guild_created", // block id
    "When the bot is added to a server", // label
    "#FF4F4F", // colour
    "guildCreate", // event
    "guildClientJoined" // event parameter/s
);

createEventVariable(
    "events_guild_created_guild", // block id
    "server the bot joined", // label
    "#FF4F4F", // colour
    "server", // output type
    "guildClientJoined" // code output
);

createRestrictions(
    ["events_guild_created_guild"],
    [
        {
            type: "hasHat",
            blockTypes: ["events_guild_created"],
            message: "This block must be in the 'When the bot is added to a server' event",
        },
    ]
);

createEventBlock(
    "events_guild_deleted", // block id
    "When the bot is removed from a server", // label
    "#FF4F4F", // colour
    "guildDelete", // event
    "guildRemovedClient" // event parameter/s
);

createEventVariable(
    "events_guild_deleted_guild", // block id
    "server that removed the bot", // label
    "#FF4F4F", // colour
    "server", // output type
    "guildRemovedClient" // code output
);

createRestrictions(
    ["events_guild_deleted_guild"],
    [
        {
            type: "hasHat",
            blockTypes: ["events_guild_deleted"],
            message: "This block must be in the 'When the bot is removed from a server' event",
        },
    ]
);

createEventBlock(
    "events_guild_memberAdd", // block id
    "When a member joins a server", // label
    "#FF4F4F", // colour
    "guildMemberAdd", // event
    "guildMemberAdded" // event parameter/s
);

createEventVariable(
    "events_guild_memberAdd_member", // block id
    "member that joined", // label
    "#FF4F4F", // colour
    "member", // output type
    "guildMemberAdded" // code output
);

createEventVariable(
    "events_guild_memberAdd_server", // block id
    "server the member joined to", // label
    "#FF4F4F", // colour
    "server", // output type
    "guildMemberAdded.guild" // code output
);

createRestrictions(
    ["events_guild_memberAdd_member", "events_guild_memberAdd_server"],
    [
        {
            type: "hasHat",
            blockTypes: ["events_guild_memberAdd"],
            message: "This block must be in the 'When a member joins a server' event",
        },
    ]
);

createEventBlock(
    "events_remove_guildmemberremove", // block id
    "When a member leaves / gets kicked from a server", // label
    "#FF4F4F", // colour
    "guildMemberRemove", // event
    "leavingMember" // event parameter/s
);

createEventVariable(
    "events_remove_guildmemberremove_member", // block id
    "leaving member", // label
    "#FF4F4F", // colour
    "member", // output type
    "leavingMember" // code output
);

createEventVariable(
    "events_remove_guildmemberremove_server", // block id
    "server that the member left from", // label
    "#FF4F4F", // colour
    "server", // output type
    "leavingMember.guild" // code output
);

createRestrictions(
    ["events_remove_guildmemberremove_member", "events_remove_guildmemberremove_server"],
    [
        {
            type: "hasHat",
            blockTypes: ["events_remove_guildmemberremove"],
            message:
                "This block must be in the 'When a member leaves / gets kicked from a server' event",
        },
    ]
);