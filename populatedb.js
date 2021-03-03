const mongoose = require('mongoose');
const User = require('./models/user');
const Text = require('./models/text');
const Language = require('./models/language');
const Keyboard = require('./models/keyboard');

const engLayout = require('./utils/keyboardLayouts').en;

const DATABASE_URL = process.env.DATABASE_URL;
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
      title: `My day`,
      text: `First, I wake up. Then, I get dressed. I walk to school. I do not ride a bike. I do not ride the bus. I like to go to school. It rains. I do not like rain. I eat lunch. I eat a sandwich and an apple.

      I play outside. I like to play. I read a book. I like to read books. I walk home. I do not like walking home. My mother cooks soup for dinner. The soup is hot. Then, I go to bed. I do not like to go to bed. `
    });

  }
)();


