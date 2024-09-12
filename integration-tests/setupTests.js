const { prettyFactory } = require('pino-pretty');

const pretty = prettyFactory({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
});

global.console = {
  ...console,
  log: (...messages) => {
    try {
      const parsedMessage = JSON.parse(messages[0]);
      process.stdout.write(pretty(parsedMessage) + '\n');
    } catch (error) {
      process.stdout.write(messages.join(' ') + '\n');
    }
  },
  debug: (...messages) => {
    process.stdout.write(messages.join(' ') + '\n');
  },
};
