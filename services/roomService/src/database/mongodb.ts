import mongoose from 'mongoose';

module.exports = {
  connect: (DB_URL: string) => {

    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set('useUnifiedTopology', true);
    mongoose.set('poolSize', 10);
    mongoose.connect(DB_URL);


    mongoose.connection.on('error', () => {
      process.exit();
    });
  },

  close: () => {
    mongoose.connection.close();
  },
};
