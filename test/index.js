'use strict';

// Load external modules
var Code = require('code');
var Hapi = require('hapi');
var Lab = require('lab');
var Nodemailer = require('nodemailer');
var Path = require('path');

// Test shortcuts
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Mailer', function () {

    it('sends the email when a view is used', function (done) {

        var server = new Hapi.Server();

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
                        path: Path.join(__dirname, 'templates')
                    }
                }
            }
        };

        var plugin = {
            plugin: require('..'),
            options: options
        };

        server.pack.register(plugin, function (err) {

            server.inject({ method: 'POST', url: '/' }, function (res) {

                expect(res.result).to.be.an.object();
                expect(res.result.response.toString()).to.contain('<p>HANDLEBARS</p>');

                done();
            });
        });
    });

    it('sends the email when content is loaded from file', function (done) {

        var server = new Hapi.Server();

        server.route({
            method: 'POST',
            path: '/',
            handler: function (request, reply) {

                var data = {
                    from: 'from@example.com',
                    to: 'to@example.com',
                    subject: 'test',
                    html: {
                        path: Path.join(__dirname, 'templates/nodemailer.html')
                    }
                };

                var Mailer = request.server.plugins.mailer;
                Mailer.sendMail(data, function (err, info) {

                    reply(info);
                });
            }
        });

        var plugin = {
            plugin: require('..'),
            options: {
                transport: require('nodemailer-stub-transport')()
            }
        };

        server.pack.register(plugin, function (err) {

            server.inject({ method: 'POST', url: '/' }, function (res) {

                expect(res.result).to.be.an.object();
                expect(res.result.response.toString()).to.contain('<p>NODEMAILER</p>');

                done();
            });
        });
    });

    it('send the email when content is a string', function (done) {

        var server = new Hapi.Server();

        server.route({
            method: 'POST',
            path: '/',
            handler: function (request, reply) {

                var data = {
                    from: 'from@example.com',
                    to: 'to@example.com',
                    subject: 'test',
                    html: '<p>NODEMAILER</p>'
                };

                var Mailer = request.server.plugins.mailer;
                Mailer.sendMail(data, function (err, info) {

                    reply(info);
                });
            }
        });

        var plugin = {
            plugin: require('..'),
            options: {
                transport: require('nodemailer-stub-transport')()
            }
        };

        server.pack.register(plugin, function (err) {

            server.inject({ method: 'POST', url: '/' }, function (res) {

                expect(res.result).to.be.an.object();
                expect(res.result.response.toString()).to.contain('<p>NODEMAILER</p>');

                done();
            });
        });
    });

    it('throws an error when rendering fails', function (done) {

        var server = new Hapi.Server({ debug: false });

        server.route({
            method: 'POST',
            path: '/',
            handler: function (request, reply) {

                var Mailer = request.server.plugins.mailer;

                var data = {
                    from: 'from@example.com',
                    to: 'to@example.com',
                    subject: 'test',
                    html: {
                        path: 'invalid.html'
                    },
                    context: {
                        content: 'HANDLEBARS'
                    }
                };

                Mailer.sendMail(data, function (err, info) {

                    reply(err);
                });
            }
        });

        var options = {
            transport: require('nodemailer-stub-transport')(),
            views: {
                engines: {
                    html: {
                        module: require('handlebars'),
                        path: Path.join(__dirname, 'templates')
                    }
                }
            }
        };

        var plugin = {
            plugin: require('..'),
            options: options
        };

        server.pack.register(plugin, function (err) {

            server.inject({ method: 'POST', url: '/' }, function (res) {

                expect(res.statusCode).to.equal(500);
                done();
            });
        });
    });
});
