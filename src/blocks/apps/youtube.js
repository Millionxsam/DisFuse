import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";

// Block to get YouTube profile
Blockly.Blocks["youtube_getprofile"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("Get YouTube profile of user:");
    this.appendStatementInput("code").appendField("Then").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#FF0000");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["youtube_getprofile"] = function (
  block,
  generator
) {
  var user = generator.valueToCode(block, "username", Order.NONE);
  var code = generator.statementToCode(block, "code");

  return `const yt = require('youtube-search-without-api-key');
await yt.search(${user})
  .then(youtubeUserProfileInformation => {
    ${code}})
  .catch(error => console.error('Error fetching YouTube user profile:', error));`;
};

// Block to get YouTube profile info
Blockly.Blocks["youtube_getprofileinfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("get")
      .appendField(
        new Blockly.FieldDropdown([
          ["title", "channel.title"],
          ["description", "channel.description"],
          ["country", "channel.country"],
          ["view count", "channel.viewCount"],
          ["subscriber count", "channel.subscriberCount"],
          ["video count", "channel.videoCount"],
          ["profile picture", "channel.thumbnail"],
        ]),
        "info"
      )
      .appendField("of YouTube profile");
    this.setOutput(true, null);
    this.setColour("#FF0000");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["youtube_getprofileinfo"] = function (block) {
  var info = block.getFieldValue("info");
  return [`youtubeUserProfileInformation.${info}`, Order.ATOMIC];
};

// Block to get YouTube videos (most recent, most viewed, most liked)
Blockly.Blocks["youtube_getvideo"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("Get")
      .appendField(
        new Blockly.FieldDropdown([
          ["most recent video", "recent"],
          ["most viewed video", "viewed"],
          ["most liked video", "liked"],
        ]),
        "type"
      )
      .appendField("of YouTube user:");
    this.setOutput(true, null);
    this.setColour("#FF0000");
    this.setTooltip("");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["youtube_getvideo"] = function (
  block,
  generator
) {
  var user = generator.valueToCode(block, "username", Order.NONE);
  var type = block.getFieldValue("type");

  return [
    `const yt = require('youtube-search-without-api-key');
await yt.search(${user})
  .then(videos => {
    let video;
    if ('${type}' === 'recent') {
      video = videos[0]; // Assuming the most recent video is the first in the list
    } else if ('${type}' === 'viewed') {
      video = videos.sort((a, b) => b.views - a.views)[0];
    } else if ('${type}' === 'liked') {
      video = videos.sort((a, b) => b.likes - a.likes)[0];
    }
    return video;
  })
  .catch(error => console.error('Error fetching YouTube videos:', error))`,
    Order.AWAIT,
  ];
};
