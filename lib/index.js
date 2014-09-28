// Load external modules
var Items = require('items');
var Nodemailer = require('nodemailer');
var Path = require('path');

// Declare internals
var internals = {};


internals.isView = function (path) {

    if (internals.views && internals.views.engines && typeof internals.views.engines === 'object') {

        var extension = Path.extname(path).substr(1);

        return internals.views.engines.hasOwnProperty(extension);
    }
};


internals.prepareMail = function (data, callback) {

    Items.parallel(['text', 'html'], function (format, cb) {

        var path = typeof data[format] === 'object' && data[format].path || '';

        if (internals.isView(path)) {
            internals.plugin.render(path, data.context, function (err, rendered) {

                if (err) {
                    return cb(err);
                }

                data[format] = rendered;
                cb();
            });
        }
        else {
            cb();
        }
    }, callback);
};


internals.sendMail = function (data, callback) {

    internals.prepareMail(data, function (err) {

        if (err) {
            return callback(err);
        }

        delete data.context;
        internals.transport.sendMail(data, callback);
    });
};


exports.register = function (plugin, options, next) {

    internals.plugin = plugin;
    internals.views = options.views;
    internals.transport = Nodemailer.createTransport(options.transport);

    if (options.views) {
        plugin.views(options.views);
    }

    plugin.expose('sendMail', internals.sendMail);
    next();
};


exports.register.attributes = {
    name: 'mailer'
};
