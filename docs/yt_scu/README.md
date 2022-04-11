# Програмний модуль yt_scu | Вступ

**Програмний модуль yt_scu – "Завантаження повних текстів повідомлень, скринів і транскрипції медіафайлів відеохостінгу Youtube за визначеними тегами"**, який написаний мовою програмування `Perl 5` [v5.28.1](https://perldoc.perl.org/5.28.1/perl5281delta), призначений для завантаження повних текстів повідомлень, скринів (екранних копій) і транскрипції медіафайлів відеохостінгу [Youtube.com](https://www.youtube.com/), що містять ключові слова (теги) із заданого переліку, а також перетворення скачаної інформації до внутрішнього системного вигляду. 

### Зміст
- [Позначення та найменування програмного модуля](#name)
- [Програмне забезпечення, необхідне для функціонування програмного модуля](#software)
- [Функціональне призначення](#function)
- [Опис логічної структури](#structure)
- [Використовувані технічні засоби](#hardware)
- [Виклик та завантаження](#run)

<a name="name"></a>
<h2>Позначення та найменування програмного модуля</h2>

Програмний модуль має позначення **"yt_scu"**.

Повне найменування програмного модуля – **"Завантаження повних текстів повідомлень, скринів і транскрипції медіафайлів відеохостінгу Youtube за визначеними тегами"**.

<a name="software"></a>
<h2>Програмне забезпечення, необхідне для функціонування програмного модуля</h2>

Для функціонування програмного модуля, написаного мовою програмування `Perl 5` ([v5.28.1](https://perldoc.perl.org/5.28.1/perl5281delta)), необхідне наступне програмне забезпечення та пакети:

- `Docker` [v20.10](https://docs.docker.com/engine/release-notes/#version-2010)
- `Kubernetes` [v1.22.4](https://github.com/kubernetes/kubernetes/releases/tag/v1.22.4)
- `utf8 for Perl` [v5.28.1](https://perldoc.perl.org/5.28.1/utf8) (Perl pragma to enable/disable UTF-8 (or UTF-EBCDIC) in source code)
- 	`LWP for Perl` [v5.28.1](https://perldoc.perl.org/5.28.1/perl5281delta) (The World-Wide Web library for Perl)
-	`HTTP for Perl` [v5.28.1](https://perldoc.perl.org/5.28.1/perl5281delta) (HTTP Handlers)
-	`GNU wget` [v1.14](https://www.gnu.org/software/wget/) (formerly Geturl, a computer program that retrieves content from web servers.)

<a name="function"></a>
<h2>Функціональне призначення</h2>

Програмний модуль **"yt_scu"** призначений для завантаження повних текстів повідомлень, скринів (екранних копій) і транскрипції медіафайлів відеохостінгу [Youtube.com](https://www.youtube.com/), що містять ключові слова (теги) із заданого переліку, а також перетворення скачаної інформації до внутрішнього системного вигляду. 

<a name="structure"></a>
<h2>Опис логічної структури</h2>

Програмний модуль складається з частин:
-	Завантаження конфігуратора – переліку каналів відеохостінгу `Youtube` з локального диску сервера
-	Завантаження масивів даних у форматі HTML, що відповідають заданим тегам і розміщуються на веб-сайті [Youtube.com](https://www.youtube.com/) за адресами вигляду https://www.youtube.com/results?sp=EgIIAw%253D%253D&q=«Тег»
-	Попередньої обробки даних, що відповідають заданим ключовим словам із відеохостінгу `Youtube` і виокремлення окремих полів із файлів у форматі `HTML`
-	Контролю вмісту поля «посилання» на дублювання
-	Сканування повних текстів транскрипцій і екранних форм з веб-сайту [Youtube.com](https://www.youtube.com/) зі знайдених посилань
-	Первинної обробки завантажених документів
-	Виводу документів у робочі файли на сервері (текстові і графічні)
-	Заповнення журналів роботи програмного модуля
-	Виклику програмного модуля перетворення даних із внутрішнього системного формату до формату `XML`

Програмний модуль **"ytcs_scu.pl"** завантажує масиви даних, що відповідають заданим тегам і розміщуються на веб-сайті [Youtube.com](https://www.youtube.com/) за адресами вигляду https://www.youtube.com/results?sp=EgIIAw%253D%253D&q=«Тег», виокремлює контент з цих  масивів, забирає посилання, якщо посилання ще не використовувалось раніше, звертається до веб-сайту Youtube.com, скачує контент транскрипцій і екранних форм, перетворює ці данні до внутрішнього системного формату, викликає програмний модуль перетворення даних із внутрішнього системного формату до формату `XML`.

<a name="hardware"></a>
<h2>Використовувані технічні засоби</h2>

Програмний модуль експлуатується на сервері (або у хмарі серверів) під управлінням операційної системи типу `Linux` (64 разряди). В основі управління всіх сервісів є система оркестрації `Kubernetes`, де всі контейнери працюють з використанням `Docker`.

<a name="run"></a>
<h2>Виклик та завантаження</h2>

Завантаження програмного модуля забезпечується введенням в командному рядку (або виказанням у таблиці `crontab`)  повного імені завантажувального модуля без додаткових параметрів. Дані, отримані в результаті застосування цього модуля перетворюються до формату `XML` за допомогою окремого модулю `convert-obr1.pl`.