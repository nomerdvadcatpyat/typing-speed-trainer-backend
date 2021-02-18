const mongoose = require('mongoose');
const config = require('config');
const User = require('./models/user');
const Text = require('./models/text');
const Language = require('./models/language');
const Keyboard = require('./models/keyboard');

const engLayout = require('./utils/keyboardLayouts').en;

const DATABASE_URL = config.get("databaseURL");
mongoose.connect(DATABASE_URL);
mongoose.Promise = global.Promise;


(
  async () => {
    const admin = await User.findOne({ email: 'admin@admin.com'});
    // console.log(admin);

    const en = await Language.findOne({ name: 'en' });

    // await Keyboard.create({ language: en, layout: engLayout });

    await Text.create({
      owner: admin,
      language: en,
      title: `LoremIpsum`,
      text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit 
      esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
    });

  }
)();


