# Програмний модуль **`telegramScanany`** | Вступ

**Програмний модуль `telegramScanany` – "Завантаження текстів повідомлень із вибраних каналів месенджера [Telegram](https://telegram.org/), що опубліковані за вибраними аккаунтами"**, який написаний мовою програмування [JavaScript](https://www.javascript.com/) з використанням формату серіалізації даних  - [YAML](https://yaml.org/), призначений для завантаження повних текстів повідомлень вибраних каналів мережі `Telegram`, що розміщаються на веб-сайті [telegram.org](https://telegram.org/), а також перетворення завантаженої інформації до формату `JSON`. 

### Зміст
- [Позначення та найменування програмного модуля](#name)
- [Програмне забезпечення, необхідне для функціонування програмного модуля](#software)
- [Функціональне призначення](#function)
- [Опис логічної структури](#structure)
- [Використовувані технічні засоби](#hardware)
- [Виклик та завантаження](#run)
- [Вхідні дані](#inputdata)
- [Вихідні дані](#outputdata)

<a name="name"></a>
<h2>Позначення та найменування програмного модуля</h2>

Програмний модуль має позначення "**`telegramScanany`**".

Повне найменування програмного модуля – **"Завантаження текстів із повідомлень вибраних каналів месенджера [Telegram](https://telegram.org/), що опубліковані за вибраними аккаунтами"**.

<a name="software"></a>
<h2>Програмне забезпечення, необхідне для функціонування програмного модуля</h2>

Для функціонування програмного модуля, написаного мовою програмування [JavaScript](https://www.javascript.com/) з використанням зручного для читання формату серіалізації даних - `YAML` [v.1.2.1](https://yaml.org/spec/1.2.1/), необхідне наступне програмне забезпечення, пакети та плагіни:

- `Docker` [v20.10](https://docs.docker.com/engine/release-notes/#version-2010)
- `Kubernetes` [v1.22.4](https://github.com/kubernetes/kubernetes/releases/tag/v1.22.4)
- `Node.js` [v16.13.0](https://nodejs.org/download/release/v16.13.0/)
- `Yaml.js` [v0.3.0](https://www.npmjs.com/package/yamljs/v/0.3.0)
- `arraybuffer-to-buffer` [v0.0.7](https://www.npmjs.com/package/arraybuffer-to-buffer/v/0.0.7)
- `axios` [0.24.0](https://www.npmjs.com/package/axios/v/0.24.0)
- `axois` [v0.0.1-security](https://www.npmjs.com/package/axios-http/v/0.0.1-security)
- `cheerio` [v1.0.0-rc.10](https://www.npmjs.com/package/cheerio/v/1.0.0-rc.10)
- `csvjson` [v5.1.0](https://www.npmjs.com/package/csvjson/v/5.1.0)
- `deep-extend` [v0.6.0](https://www.npmjs.com/package/deep-extend/v/0.6.0)
- `js-plugin` [v1.0.9](https://www.npmjs.com/package/js-plugin/v/1.0.9)
- `js-yaml` [v4.1.0](https://www.npmjs.com/package/js-yaml/v/4.1.0)
- `json2csv` [v5.0.6](https://www.npmjs.com/package/json2csv/v/5.0.6)
- `lodash` [v4.17.21](https://www.npmjs.com/package/lodash/v/4.17.21)
- `mammoth` [v1.4.19](https://www.npmjs.com/package/mammoth/v/1.4.19)
- `md5` [v2.3.0](https://www.npmjs.com/package/md5/v/2.3.0)
- `moment` [v2.29.1](https://www.npmjs.com/package/moment/v/2.29.1)
- `mongodb` [v4.2.2](https://www.npmjs.com/package/mongodb/v/4.2.2)
- `mysql2` [v2.3.3](https://www.npmjs.com/package/mysql2/v/2.3.3)
- `node-yaml-config` [v1.0.0](https://www.npmjs.com/package/node-yaml-config/v/1.0.0)
- `node-xlsx` [v0.21.0](https://www.npmjs.com/package/node-xlsx/v/0.21.0)
- `pdf-parse` [v1.1.1](https://www.npmjs.com/package/pdf-parse/v/1.1.1)
- `puppeteer` [v13.0.1](https://www.npmjs.com/package/puppeteer/v/13.5.1)
- `rss-parser` [v3.12.0](https://www.npmjs.com/package/rss-parser/v/3.12.0)
- `uuid` [v8.3.2](https://www.npmjs.com/package/uuid/v/8.3.2)
- `xml2js` [v0.4.23](https://www.npmjs.com/package/xml2js/v/0.4.23)

<a name="function"></a>
<h2>Функціональне призначення</h2>

Програмний модуль "**`telegramScanany`**" призначений для завантаження повних текстів повідомлень вибраних каналів мережі `Telegram`, що розміщаються на веб-сайті [telegram.org](https://telegram.org/), а також перетворення завантаженої інформації до формату `JSON`.

<a name="structure"></a>
<h2>Опис логічної структури</h2>

Програмний модуль складається з частин:
- Завантаження конфігуратора – переліку вибраних каналів мережі [Telegram](https://telegram.org/) із локального диску сервера
- Завантаження масивів даних, що відповідають заданому набору каналів мережі [Telegram](https://telegram.org/) за адресами вигляду `https://t.me/s/<<ім'я каналу>>`
- Попередньої обробки даних, що відповідають заданому набору каналів мережі [Telegram](https://telegram.org/)  і виокремлення окремих полів
- Контролю вмісту поля «посилання» на дублювання
- Обробки завантажених повідомлень, формування переліку вихідних полів
- Заповнення журналів роботи програмного модуля
- Перетворення даних із внутрішнього системного формату до формату `JSON`
- Виводу документів у робочі файли на сервері

Програмний модуль **"telegramScanany"** завантажує масиви даних, що відповідають заданому набору каналів мережі [Telegram](https://telegram.org/), виокремлює контент з цих масивів, забирає посилання, якщо посилання ще не використовувалось раніше, продовжує обробку даних повідомлення, перетворює ці дані до внутрішнього системного формату, викликає програмний модуль перетворення даних із внутрішнього системного формату до формату `JSON`.

<a name="hardware"></a>
<h2>Використовувані технічні засоби</h2>

Програмний модуль експлуатується на сервері (або у хмарі серверів) під управлінням операційної системи типу `Linux` (64 разряди). В основі управління всіх сервісів є система оркестрації `Kubernetes`, де всі контейнери працюють з використанням `Docker`.

<a name="run"></a>
<h2>Виклик та завантаження</h2>

Завантаження програмного модуля забезпечується введенням в командному рядку повного імені завантажувального модуля з додатковими параметрами.
Наприклад, для відлагодження скриптів використовуйте:

```sh
npm run debug <path to script> [<path to settings>]
```
<a name="inputdata"></a>
<h2>Вхідні дані</h2>

Формат вхідних даних - текстовий.
Вхідний текстовий файл формату `.txt` містить список посилань на вибрані канали месенджера telegramScanany, що опубліковані за вибраними аккаунтами, наприклад:
```txt
https://t.me/s/<<ім'я каналу 1>> 
https://t.me/s/<<ім'я каналу 2>> 
.
.
.
https://t.me/s/<<ім'я каналу n>> 
```
<a name="outputdata"></a>
<h2>Вихідні дані</h2>

Формат вихідних даних - `JSON`.
Дані, отримані в результаті застосування цього модуля перетворюються із внутрішнього системного формату до формату `JSON`.
Приклад вихідних даних:

```json                           
[  
  {                            
    metadata: {                            
      text: '#Политика  Российские военные завершили ряд учений, ожидается их возвращение домой   Интерфакс',                     
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><a href="?q=%23%D0%9F%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0">#Политика</a><br><i class="emoji" style="background-image:url('//telegramScanany.org/img/emoji/40/F09F87B7F09F87BA.png')"><b>��</b></i> <b>Российские военные завершили ряд учений, ожидается их возвращение домой </b>— Интер  факс</div>`,                  
      publishedAt: '2022-02-15 10:08:07'                                                                                          
    },                            
    type: 'telegramScanany',                                  
    channel: 'AK47pfl',                        
    url: 'https://t.me/s/AK47pfl',                            
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: 'd19c9177a790aa9099fabe140adae4f5'
  }                           
]
```
