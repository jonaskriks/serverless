'use strict';

const os = require('os');
const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const Serverless = require('../../../../lib/Serverless');
const CLI = require('../../../../lib/classes/CLI');
const yaml = require('js-yaml');

chai.use(require('chai-as-promised'));

const expect = chai.expect;

describe('Print', () => {
  let print;
  let serverless;
  let getServerlessConfigFileStub;

  beforeEach(() => {
    getServerlessConfigFileStub = sinon.stub();
    const PrintPlugin = proxyquire('../../../../lib/plugins/print.js', {
      '../utils/getServerlessConfigFile': {
        getServerlessConfigFile: getServerlessConfigFileStub,
      },
    });
    serverless = new Serverless();
    serverless.variables.options = {
      stage: 'dev',
      region: 'us-east-1',
    };
    serverless.cli = new CLI(serverless);
    serverless.processedInput = { options: {} };
    print = new PrintPlugin(serverless);
    print.serverless.cli = {
      consoleLog: sinon.spy(),
    };
  });

  it('should print standard config', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    return print.print().then(() => {
      const message = print.serverless.cli.consoleLog.args.join();

      expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
      expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
      expect(yaml.load(message)).to.eql(conf);
    });
  });

  it('should print standard config in JSON', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    print.options = { format: 'json' };
    return print.print().then(() => {
      const message = print.serverless.cli.consoleLog.args.join();

      expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
      expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
      expect(JSON.parse(message)).to.eql(conf);
    });
  });

  it('should apply paths to standard config in JSON', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    print.options = { format: 'json', path: 'service' };
    return print.print().then(() => {
      const message = print.serverless.cli.consoleLog.args.join();

      expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
      expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
      expect(JSON.parse(message)).to.eql(conf.service);
    });
  });

  it('should apply paths to standard config in text', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    print.options = { path: 'provider.name', format: 'text' };
    return print.print().then(() => {
      const message = print.serverless.cli.consoleLog.args.join();

      expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
      expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
      expect(message).to.eql(conf.provider.name);
    });
  });

  it('should print arrays in text', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    print.options = { transform: 'keys', format: 'text' };
    return print.print().then(() => {
      const message = print.serverless.cli.consoleLog.args.join();

      expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
      expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
      expect(message).to.eql(`service${os.EOL}provider`);
    });
  });

  it('should apply a keys-transform to standard config in JSON', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    print.options = { format: 'json', transform: 'keys' };
    return print.print().then(() => {
      const message = print.serverless.cli.consoleLog.args.join();

      expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
      expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
      expect(JSON.parse(message)).to.eql(Object.keys(conf));
    });
  });

  it('should not allow a non-existing path', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    print.options = { path: 'provider.foobar' };
    return expect(print.print()).to.be.rejected;
  });

  it('should not allow an object as "text"', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    print.options = { format: 'text' };
    return expect(print.print()).to.be.rejected;
  });

  it('should not allow an unknown transform', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    print.options = { transform: 'foobar' };
    return expect(print.print()).to.be.rejected;
  });

  it('should not allow an unknown format', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    print.options = { format: 'foobar' };
    return expect(print.print()).to.be.rejected;
  });

  it('should print special service object and provider string configs', () => {
    const conf = {
      service: {
        name: 'my-service',
      },
      provider: 'aws',
    };
    getServerlessConfigFileStub.resolves(conf);

    return print.print().then(() => {
      const message = print.serverless.cli.consoleLog.args.join();

      expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
      expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
      expect(yaml.load(message)).to.eql(conf);
    });
  });

  it('should resolve command line variables', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
        stage: '${opt:stage}',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    serverless.processedInput = {
      commands: ['print'],
      options: { stage: 'dev', region: undefined },
    };

    const expected = {
      service: 'my-service',
      provider: {
        name: 'aws',
        stage: 'dev',
      },
    };

    return print.print().then(() => {
      const message = print.serverless.cli.consoleLog.args.join();

      expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
      expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
      expect(yaml.load(message)).to.eql(expected);
    });
  });

  it('should resolve using custom variable syntax', () => {
    const conf = {
      service: 'my-service',
      provider: {
        name: 'aws',
        stage: '${{opt:stage}}',
        variableSyntax: '\\${{([ ~:a-zA-Z0-9._@\\\'",\\-\\/\\(\\)*?]+?)}}',
      },
    };
    serverless.service.provider.variableSyntax = '\\${{([ ~:a-zA-Z0-9._@\\\'",\\-\\/\\(\\)*?]+?)}}';
    getServerlessConfigFileStub.resolves(conf);

    serverless.processedInput = {
      commands: ['print'],
      options: { stage: 'dev', region: undefined },
    };

    const expected = {
      service: 'my-service',
      provider: {
        name: 'aws',
        stage: 'dev',
        variableSyntax: '\\${{([ ~:a-zA-Z0-9._@\\\'",\\-\\/\\(\\)*?]+?)}}',
      },
    };

    return print.print().then(() => {
      const message = print.serverless.cli.consoleLog.args.join();

      expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
      expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
      expect(yaml.load(message)).to.eql(expected);
    });
  });

  it('should resolve custom variables', () => {
    const conf = {
      service: 'my-service',
      custom: { region: 'us-east-1' },
      provider: {
        name: 'aws',
        stage: '${opt:stage}',
        region: '${self:custom.region}',
      },
    };
    getServerlessConfigFileStub.resolves(conf);

    serverless.processedInput = {
      commands: ['print'],
      options: { stage: 'dev', region: undefined },
    };
    serverless.service.custom = { region: 'us-east-1' };

    const expected = {
      service: 'my-service',
      custom: {
        region: 'us-east-1',
      },
      provider: {
        name: 'aws',
        stage: 'dev',
        region: 'us-east-1',
      },
    };

    return print.print().then(() => {
      const message = print.serverless.cli.consoleLog.args.join();

      expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
      expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
      expect(yaml.load(message)).to.eql(expected);
    });
  });

  describe('should resolve fallback', () => {
    [
      { value: 'hello_123@~:/+', description: 'ascii chars' },
      { value: '①⑴⒈⒜Ⓐⓐⓟ ..▉가Ὠ', description: 'unicode chars' },
    ].forEach((testCase) => {
      it(testCase.description, () => {
        const conf = {
          custom: {
            me: `\${self:none, '${testCase.value}'}`,
          },
          provider: {},
        };
        getServerlessConfigFileStub.resolves(conf);

        serverless.processedInput = {
          commands: ['print'],
          options: {},
        };

        const expected = {
          custom: {
            me: testCase.value,
          },
          provider: {},
        };

        return print.print().then(() => {
          const message = print.serverless.cli.consoleLog.args.join();

          expect(getServerlessConfigFileStub.calledOnce).to.equal(true);
          expect(print.serverless.cli.consoleLog.called).to.be.equal(true);
          expect(yaml.load(message)).to.eql(expected);
        });
      });
    });
  });
});
