// Load external modules
var Items = require('items');
var Nodemailer = require('nodemailer');


exports.register = function (plugin, options, next) {

    var transport = Nodemailer.createTransport(options.transport);

    var renderTemplate = function (data, format, context, callback) {

        plugin.render(data[format].path, context, function (err, rendered) {

            if (err) {
                return callback(err);
            }

            data[format] = rendered;
            callback();
        });
    };

    var sendMail = function (data, callback) {

        Items.parallel(['text', 'html'], function (format, cb) {

            if (typeof data[format] === 'object' && data[format].path) {
                renderTemplate(data, format, data.context, cb);
            }
            else {
                cb();
            }
        },
        function(err) {

            if (err) {
                return callback(err);
            }

            delete data.context;
            transport.sendMail(data, callback);
        });
    };

    if (options.views) {
        plugin.views(options.views);
    }

    plugin.expose({ sendMail: sendMail });
    next();
};


exports.register.attributes = {
    name: 'mailer'
};
