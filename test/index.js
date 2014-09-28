// Load external modules
var Hapi = require('hapi');
var Lab = require('lab');
var Nodemailer = require('nodemailer');
var Path = require('path');

// Test shortcuts
var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;

// Create server
var server = new Hapi.Server(0);

describe('Mailer', function () {

    before(function (done) {

        var handler = function (request, reply) {

            var Mailer = request.server.plugins.mailer;

            var data = {
                from: 'from@example.com',
                to: 'to@example.com',
                subject: 'test',
                html: {
                    path: 'handlebars.html'
                },
                context: {
                    content: 'HANDLEBARS'
                }
            };

            Mailer.sendMail(data, function (err, info) {

                reply(info);
            });
        };

        server.route({ method: 'POST', path: '/', handler: handler });

        var options = {
            transport: require('nodemailer-stub-transport')(),
            views: {
                engines: {
                    html: {
                        module: require('handlebars'),
                        path: Path.join(__dirname, 'fixtures/templates')
                    }
                }
            }
        };

        var plugin = {
            plugin: require('..'),
            options: options
        };

        server.pack.register(plugin, function (err) {

            server.start(function () {

                done();
            });
        });

    });

    it('sends the email', function (done) {

        server.inject({ method: 'POST', url: '/' }, function (res) {

            expect(res.result).to.be.an('object');
            expect(res.result.response.toString()).to.contain('<p>HANDLEBARS</p>');

            done();
        });
    });

});
