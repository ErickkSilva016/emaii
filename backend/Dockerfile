FROM php:8.3-apache

RUN docker-php-ext-install pdo_mysql \
    && sed -i 's/^Listen 80$/Listen 10000/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost [*]:80>/<VirtualHost *:10000>/' /etc/apache2/sites-available/000-default.conf \
    && mkdir -p /var/lib/php/sessions

COPY php-session.ini /usr/local/etc/php/conf.d/zz-emaii-session.ini
COPY api/ /var/www/html/api/
COPY auth/ /var/www/html/auth/
COPY config/ /var/www/html/config/

EXPOSE 10000

CMD ["sh", "-c", "chown -R www-data:www-data /var/lib/php/sessions && exec apache2-foreground"]
