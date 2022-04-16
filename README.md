# @molfar/scanany-scripts
Модуль `scanany-scripts` містить описи та [scanany](https://github.com/boldak/scanany)-скрипти 
для завантаження повних текстів веб-документів (текстів анотацій статей та препринтів, текстів повідомлень) із відкритих публічних сторінок, які наведені на веб-сайтах: 
- [Twitter](https://twitter.com/)
- [Youtube](https://www.youtube.com/)
- [Telegram](https://www.t.me)
- [Picuki](https://www.picuki.com/)
- [Medium](https://medium.com/)
- [Academia](https://www.academia.edu/)
- [arXiv](https://arxiv.org/)
- [RSS]()
- [Reddit](https://www.reddit.com/)
- [LiveJournal](https://www.livejournal.com/)
- [CONT](https://cont.ws/)
- [Facebook](https://www.facebook.com/)


## Як користуватись

Склонуйте цей репозиторій та проінсталюйте залежності:

```sh
git clone https://github.com/wdc-molfar/scanany-scripts.git
cd scanany-scripts
npm install
```

Для відлагодження скриптів використовуйте:

```sh

npm run debug <path to script> [<path to settings>]

```

Наприклад, для виконання з зовнішніми налаштуваннями треба окремо виносити ці налаштування та використовувати:

```sh
npm run debug ./src/scanany/telegram.yml ./test/params/telegram.params.yml 

```

параметри з файлу ```./test/params/telegram.params.yml``` будуть передані в скрипт ```./src/scanany/telegram.yml```.


Результаті виконання скрипта виглядає наступним чином:

```sh

> @molfar/scanany-scripts@1.0.0 debug
> node ./src/js/debug "./src/scanany/telegram.yml" "./test/params/telegram.params.yml"                                                           
                                                                                                                                  
DEBUG >> Scanany script settings { scheduler: { task: { params: [Object], state: 'planned' } } }
---------------------------------------------------------------
Debug scanany script: /Users/dmytrenko.o/Documents/GitHub/scanany-scripts/src/scanany/telegram.yml

# Скрипт telegram.yml призначений для вибірки текстів повідомлень з ресурсу https://telegram.org за допомогою
# скрапера [scanany](https://github.com/boldak/scanany)

# Входить до складу проекту [@molfar](https://github.com/wdc-molfar)


# Відлагодження відбувається за допомою команди:

# ```sh
# npm run debug <path to script> [<path to settings>]
# ```

# Наприклад:

# ```sh
# npm run debug ./src/scanany/telegram.yml ./test/params/telegram.params.yml
# ```  

# Вхідні дані формуються планувальником завдань на основі оброблення бази даних медіа-джерел.

# Приклад вхідних даних (```./test/params/telegram.params.yml```):

# ```yaml
# service: 
#   scheduler:
#     task:
#       params:
#         type: telegram
#         profile: JeffDean
#       state: planned   
# ```


# ** Опис алгоритму


# Використовуються плагіни для HTTP-запросов ```axios-plugin```, ```cheerio-plugin```, ```js-plugin``` для js-інʼєкций

- use: 
    # Dbrhg     
    - axios-plugin
    - cheerio-plugin
    - js-plugin


- log:
    - $const: DEBUG >> Scanany script settings
    - $ref: service

# Попереднє оброблення вхідних даних
- map:
    
    # Формування url зі списком публікацій на основі вихідних даних (змінна ```url```)
    - $ref: service.scheduler.task.params.channel
      transform:
        js: (command, context, value) => `https://t.me/s/${value}`
      into: url
    
    # Обчислення поточної дати в форматі ```YYYY-MM-DD HH:mm:ss``` та поміщення її у ```service.scheduler.task.processedAt```
    - transform:
        apply:
          - date
          - moment.format: YYYY-MM-DD HH:mm:ss    
      into: service.scheduler.task.processedAt

    # Зміна стану завдання ```service.scheduler.task.state``` з ```"planned"``` на ```"processed"``` 
    - $const: processed
      into: service.scheduler.task.state            

# вивід значення ```url```
# - log:
#     - $const: "URL:"
#     - $ref: url  

# вибір даних із джерела
# вибірка та оброблення сторінки зі стрічкою публікацій з використанням ```axios-plugin``` за адресою ```url``` 
- fetch:
    request:
      method: GET
      url: 
        $ref: url
    # перетворюємо відповідь (response) об'єкт cheerio      
    transform:
      apply:
        #  вибірка значення response.data       
        - project: data
        # перетворення в об'єкт cheerio      
        - html->$
    # результат перетворення записуємо в змінну "rss"      
    into: page
 
# вибірка із "page" заголовка каналу (селектор ```div.tgme_channel_info_header_title > span```)
- once:
    $ref: page
    select: div.tgme_channel_info_header_title > span
    apply:
      # перетворення text в змінну ```text```    
      transform: text
      # результат оброблення буде поміщений у ```p.title```
      into: p.title
 
# вибірка із "page" заголовка каналу (CSS-селектор селектор ```div.tgme_channel_info_description```)
- once:
    $ref: page
    select: div.tgme_channel_info_description
    apply:
      # переворення вибраного елемента в html     
      transform: html
      # результат оброблення буде поміщений у ```p.description```
      into: p.description
 
# вибірка із "page" аватара каналу (CSS-селектор ```div.tgme_channel_info > div.tgme_channel_info_header > i > img```)
- once:
    $ref: page
    select: div.tgme_channel_info > div.tgme_channel_info_header > i > img
    apply:
       -  transform: 
            apply:
              # вибірка із вибраного елемента атрибута ```"src" -> { src: "<<value>>"}```   
              - attributes: src
              # повернення значення поля "src" 
              - project: src 
          # запис результату перетворення в "p.image"
          into: p.image
        
# вибірка из "page" всіх повідомлень (CSS-селектор ```div.tgme_widget_message_bubble```) 
- all:
    $ref: page
    select: div.tgme_widget_message_bubble
    # запис колекції повідомлень в ```res```
    into: res
        
# Оброблення елементів колекції   
- each:
    # колекція
    in:
      $ref: res
    # поточний елемент ```item```
    as: item
    indexed-by: index
    # результат оброблення буде поміщений у ```messages```
    into: messages
    
    # алгоритм оброблення поточного елемента ```item```
    apply:
      
      - map:
          $ref: item
          # перетворення tem -> html -> объект cheerio
          transform: 
            apply:
              - html
              - html->$
          # результат оброблення буде поміщений у ```msg```
          into: msg
      
      # вибірка із "msg" тексту повідомлення (CSS-селектор ```div.tgme_widget_message_text```)
      - once:
          $ref: msg
          select: div.tgme_widget_message_text
          apply:  
            
            # перетворення вибраного елемента в text та поміщення його в змінну ```message.text```
            - transform: 
                apply:
                  - text
                  - js: '(command, context, value) => value.replace(/[\u2000-\uffff]+/g, " ")'
              into: message.text
            
            # перетворення вибраного елемента в html та поміщення його в змінну ```message.html```
            - transform: html
              into: message.html
      
      # вибірка із "msg" часу публікації повідомлення (CSS-селектор ```time```)
      - once:
          $ref: msg
          select: time
          apply:
            # отримання часу публікації
            - transform: 
                
                # забираємо із вибраного елемента ```time``` атрибут "datetime" та перетворення його у формат ```YYYY-MM-DD HH:mm:ss```         
                apply:
                  - attributes: datetime
                  - project: datetime
                  - date
                  - moment.format: YYYY-MM-DD HH:mm:ss
              # результат оброблення буде поміщений у ```message.publishedAt```
              into: message.publishedAt
      
      - map:
        # отримання унікального ID на основі контенту
        - $ref: index
          into: message.index

        # перетворення ```tweet.text``` в сигнатуру md5
        # результат оброблення буде поміщений у ```res.md5```
        - $ref: message.text
          transform: md5
          into: message.md5

        - $ref: message
          into: m.service.scraper.message  

        - $ref: p
          into: m.service.scraper.page 

        # Формування остаточного результату оброблення поточного елементу колекції ```res```
        - $ref: service.scheduler
          into: m.service.scheduler 
      # повернення результату оброблення поточного елемента ```item``` колекції ```res``` в ```m```       
      - return: m          
 
# повернення результату роботи скрипта
- return: messages          

---------------------------------------------------------------
Call with params: /Users/dmytrenko.o/Documents/GitHub/scanany-scripts/test/params/telegram.params.yml


service: 
  scheduler:
    task:
      params:
        type: telegram
        channel: AK47pfl
      state: planned

---------------------------------------------------------------
Scanany result:

[
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  14.04.2022  ЦБ думает смягчить требования к продаже валютной выручки. Ранее Минфин обязал экспортеров продавать 80% валютной выручки.  Производители полимерной упаковки и других товаров из пластика с февраля повысили цены на продукцию на 10-50%.  Президент Байден отправляет Украине тяжелое вооружение на $800 млн. Это проверит пределы того, насколько далеко может зайти США, не втягивая себя в боевые действия.  Еврокомиссия сочла указ Путина об оплате за газ в рублях нарушением антироссийских санкций.  Третья по величине китайская нефтегазовая госкомпания CNOOC продает свои активы в Британии, США и Канаде на $3 млрд. К чему-то готовятся?.. Ожидается:  Совещание Путина по ситуации в нефтегазовой сфере.#morning@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/E29880.png')\"><b>☀️</b></i> <b>14.04.2022</b><br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F87B7F09F87BA.png')\"><b>🇷🇺</b></i><br>• ЦБ думает смягчить <a href=\"https://www.rbc.ru/economics/14/04/2022/6257678c9a7947700d5e841c\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">требования к продаже валютной выручки</a>. Ранее Минфин обязал экспортеров продавать 80% валютной выручки.<br>• Производители полимерной упаковки и других товаров из пластика с февраля <a href=\"https://www.vedomosti.ru/business/news/2022/04/14/918031-podorozhanii-upakovki-trub-plastika\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">повысили цены</a> на продукцию на 10-50%.<br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F8C8E.png')\"><b>🌎</b></i><br>• Президент <a href=\"https://www.bloomberg.com/news/articles/2022-04-13/biden-announces-800-million-weapons-package-for-ukraine?utm_source=telegram&amp;utm_medium=msg&amp;utm_campaign=telegram\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">Байден отправляет</a> Украине <a href=\"https://t.me/cbrstocks/35340\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">тяжелое вооружение</a> на $800 млн. Это проверит пределы того, насколько далеко может зайти США, не втягивая себя в боевые действия.<br>• Еврокомиссия сочла указ Путина об оплате за газ в рублях <a href=\"https://www.bloomberg.com/news/articles/2022-04-13/eu-warns-putin-s-rubles-for-gas-demand-would-breach-sanctions\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">нарушением антироссийских санкций</a>.<br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F87A8F09F87B3.png')\"><b>🇨🇳</b></i><br>• Третья по величине китайская нефтегазовая госкомпания CNOOC <a href=\"https://tass.ru/ekonomika/14372537?utm_source=yxnews&amp;utm_medium=desktop\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">продает</a> свои активы в Британии, США и Канаде на $3 млрд. К чему-то готовятся?..<br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/E29D97.png')\"><b>❗️</b></i><b>Ожидается:</b><br>• Совещание Путина по ситуации в нефтегазовой сфере.<br><br><a href=\"?q=%23morning\">#morning</a><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-14 09:30:18",
     "index": 0,
     "md5": "c54eed430a124b9165d429399bf5f49f"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  В российскую недвижимость могут прийти непотраченные на отдыхе и на импортные товары 4 трлн рублей.Сколько денег тратят россияне на импортные товары и за рубежом?По оценкам источников РДВ доля потребительского импорта составляет порядка 47%, это ~$140 млрд в год. Плюс россияне тратят деньги за рубежом, по некоторым оценкам это ~$35 млрд в год.Итого: $175 млрд трат в поездках за границей и на импортные товары в России. Эксперты считают, что 70% этих денег перетекут в траты внутри страны на товары-аналоги (не 100%, так как у немецких автомобилей, швейцарских часов, украшений, одежды особых аналогов в России нет).До 4.2 трлн рублей из этих денег могут пойти на покупку недвижимости. Для сравнения, весь рынок недвижимости составляет около 17 трлн рублей (см. график).@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F8F97.png')\"><b>🏗</b></i> <b>В российскую недвижимость могут прийти непотраченные на отдыхе и на импортные товары 4 трлн рублей.</b><br><br><u>Сколько денег тратят россияне на импортные товары и за рубежом?</u><br><br>По оценкам источников РДВ доля потребительского импорта составляет порядка 47%, это ~$140 млрд в год. Плюс россияне тратят деньги за рубежом, по <a href=\"https://www.interfax.ru/russia/763939\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">некоторым оценкам</a> это ~$35 млрд в год.<br><br><u>Итого: $175 млрд трат в поездках за границей и на импортные товары в России.</u> Эксперты считают, что 70% этих денег перетекут в траты внутри страны на товары-аналоги (не 100%, так как у немецких автомобилей, швейцарских часов, украшений, одежды особых аналогов в России нет).<br><br><u>До 4.2 трлн рублей из этих денег <a href=\"https://t.me/AK47pfl/11869\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">могут пойти на покупку недвижимости</a></u>. Для сравнения, весь рынок недвижимости составляет около 17 трлн рублей (см. график).<br><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-14 10:22:01",
     "index": 1,
     "md5": "e7fd6337e7f94c003945b1bea25e23ea"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "РынкиДеньгиВласть | РДВ pinned «  The Big $hort. Стратег Credit Suisse рассуждает о закате доллара. В будущем доллара засомневался не Хазин, а Zoltan Pozsar   «дитя» денежной системы США, один из самых известных аналитиков по денежному рынку, сотрудник топ-банка, успевший поработать в Moody s »",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><a class=\"tgme_widget_message_author_name\" href=\"https://t.me/AK47pfl\"><span dir=\"auto\">РынкиДеньгиВласть | РДВ</span></a> pinned «<span class=\"tgme_widget_service_strong_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F94A5.png')\"><b>🔥</b></i> The Big $hort. Стратег Credit Suisse рассуждает о закате доллара. В будущем доллара засомневался не Хазин, а Zoltan Pozsar — «дитя» денежной системы США, один из самых известных аналитиков по денежному рынку, сотрудник топ-банка, успевший поработать в Moody’s…</span>»</div>",
     "publishedAt": "2022-04-14 11:17:11",
     "index": 2,
     "md5": "0b6b154b7a3a3901cce9aaa9297c3bba"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  Акции ДВМП (FESH) могут вырасти в 3 раза. Даже при ранее полученных оценках роста бизнеса на 30-40%, что очень консервативно для ДВМП, акция этой компании (по модели DCF источников РДВ) недооценена более чем в 2 раза.По мнению экспертов и источников, с которыми поговорили РДВ, в связи с текущей ситуацией в мире, бизнес вырастет на 100%, что в 2.5 раза выше консервативных оценок. В будущем для акций ДВМП это может означать кратный рост.  Справедливая цена акций ДВМП (FESH) 97 рублей, потенциал роста +180%.#FESH@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/E29AA1.png')\"><b>⚡️</b></i> <b>Акции ДВМП (<a href=\"https://putinomics.ru/dashboard/FESH/MOEX\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">FESH</a>) могут вырасти в 3 раза.</b> Даже при ранее полученных оценках роста бизнеса на 30-40%, что очень консервативно для ДВМП, акция этой компании (по модели DCF источников РДВ) недооценена более чем в 2 раза.<br><br>По мнению экспертов и источников, с которыми поговорили РДВ, в связи с текущей ситуацией в мире, <b>бизнес вырастет на 100%</b>, что в 2.5 раза выше консервативных оценок. <b>В будущем для акций ДВМП это может означать кратный рост.</b><br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F9189.png')\"><b>👉</b></i> <a href=\"https://putinomics.ru/dashboard/FESH/MOEX\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">Справедливая цена акций ДВМП (FESH) 97 рублей, потенциал роста +180%.</a><br><br><a href=\"?q=%23FESH\">#FESH</a><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-14 11:43:23",
     "index": 3,
     "md5": "b2e975d85ab64e16039c16506dfda01a"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  ДВМП (FESH): справедливая стоимость 97 руб., апсайд +175%.Рыночная цена акций стремится к их справедливой цене:  https://t.me/AK47pfl/9595#оценка #FESH @AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F94A6.png')\"><b>🔦</b></i><b> ДВМП (<a href=\"http://putinomics.ru/dashboard/FESH/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">FESH</a>): справедливая стоимость 97 руб., апсайд +175%.<br><br>Рыночная цена акций стремится к их справедливой цене:<br></b><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F9189.png')\"><b>👉</b></i><b> </b><a href=\"https://t.me/AK47pfl/9595\" target=\"_blank\" rel=\"noopener\">https://t.me/AK47pfl/9595</a><br><br><a href=\"?q=%23%D0%BE%D1%86%D0%B5%D0%BD%D0%BA%D0%B0\">#оценка</a> <a href=\"?q=%23FESH\">#FESH</a> <br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-14 11:49:05",
     "index": 4,
     "md5": "f61f1cfac11a21eb8d95a44e8b8306b5"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "Тем временем порты Дальнего Востока не справляются с большой нагрузкой. Цены на услуги компаний, входящих в группу ДВМП, выросли в 2-3 раза.",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\">Тем временем порты Дальнего Востока не справляются с большой нагрузкой. Цены на услуги компаний, входящих в группу ДВМП, выросли в 2-3 раза.</div>",
     "publishedAt": "2022-04-14 11:58:36",
     "index": 5,
     "md5": "9a1349c4e778685f604ee43206bfb06e"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  О потенциале роста ДВМП (FESH) пишут в Известиях. Биржевые аналитики оценили перспективы роста ценных бумаг российских грузоперевозчиков:  https://iz.ru/1317470/aleksandr-lesnykh/karavanami-parokhodami-mozhno-li-zarabotat-na-aktciiakh-logisticheskikh-kompaniiВот некоторые цитаты:  ДВМП   один из главных бенефициаров антироссийских санкций.  Для понимания того, как может вырасти грузопоток на Востоке, на примере контейнеров: грузооборот из портов на Балтике, завязанных на торговле с Европой, в прошлом году составил 2.5 млн контейнеров, на Востоке   только 1.9 млн.  Российская торговля переориентируется на Восток. Это перетянет значительный объем товарных перевозок из портов на Балтике, обслуживающих европейские маршруты, в крупнейший торговый порт Дальнего Востока.  Если европейские объемы уйдут в Азию, то грузопоток через восточные порты вырастет примерно в два раза.  В условиях ухудшения отношений со странами Запада Россия активнее начнет развивать торговлю в азиатском направлении.  ДВМП является лидером контейнерных перевозок через Дальний Восток, владеет Владивостокским морским торговым портом (ВМТП)   по сути, ключевыми воротами РФ при торговле с Азией.  Акции ДВМП могут быть интересны на долгосрочном горизонте в виде ставки на расширение торгового сотрудничества с Азией.  Справедливая цена акций ДВМП (FESH) 97 рублей, потенциал роста +175%.@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F979E.png')\"><b>🗞</b></i> <b>О потенциале роста ДВМП</b> <b>(<a href=\"http://putinomics.ru/dashboard/FESH/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">FESH</a>) пишут</b> <b>в Известиях</b>. Биржевые аналитики оценили перспективы роста ценных бумаг российских грузоперевозчиков:<br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F9189.png')\"><b>👉</b></i> <a href=\"https://iz.ru/1317470/aleksandr-lesnykh/karavanami-parokhodami-mozhno-li-zarabotat-na-aktciiakh-logisticheskikh-kompanii\" target=\"_blank\" rel=\"noopener\">https://iz.ru/1317470/aleksandr-lesnykh/karavanami-parokhodami-mozhno-li-zarabotat-na-aktciiakh-logisticheskikh-kompanii</a><br><br>Вот некоторые цитаты:<br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F94A5.png')\"><b>🔥</b></i> <u><b>ДВМП — один из главных бенефициаров антироссийских санкций.</b></u><br>• Для понимания того, как может вырасти грузопоток на Востоке, на примере контейнеров: грузооборот из портов на Балтике, завязанных на торговле с Европой, в прошлом году составил 2.5 млн контейнеров, на Востоке — только 1.9 млн.<br>• Российская торговля переориентируется на Восток. Это перетянет значительный объем товарных перевозок из портов на Балтике, обслуживающих европейские маршруты, в крупнейший торговый порт Дальнего Востока.<br>• Если европейские объемы уйдут в Азию, то грузопоток через восточные порты вырастет примерно в два раза.<br>• В условиях ухудшения отношений со странами Запада Россия активнее начнет развивать торговлю в азиатском направлении.<br>• ДВМП является лидером контейнерных перевозок через Дальний Восток, владеет Владивостокским морским торговым портом (ВМТП) — по сути, ключевыми воротами РФ при торговле с Азией.<br>• Акции ДВМП могут быть интересны на долгосрочном горизонте в виде ставки на расширение торгового сотрудничества с Азией.<br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F9189.png')\"><b>👉</b></i> <a href=\"https://putinomics.ru/dashboard/FESH/MOEX\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">Справедливая цена акций ДВМП (FESH) 97 рублей, потенциал роста +175%.</a><br><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-14 12:12:10",
     "index": 6,
     "md5": "78e6a9a52facd83097de40534d9bb9ab"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "Гости казино скидывают в личку сравнение транспортных компаний по мультам:- простаивающий НМТП сейчас стоит 4 годовых прибыли- мутный Глобалтранс стоит 5.2 годовых прибылиСколько стоит ДВМП, который единственный выигрывает от переориентации на восток?Пока всего 2.8 годовых прибыли!!! Если это не буй, то вообще хз что такое буй.",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\">Гости казино скидывают в личку сравнение транспортных компаний по мультам:<br><br>- простаивающий НМТП сейчас стоит 4 годовых прибыли<br>- мутный Глобалтранс стоит 5.2 годовых прибыли<br><br>Сколько стоит ДВМП, который единственный <a href=\"https://t.me/finpizdec/9245\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">выигрывает</a> от переориентации на восток?<br><br>Пока всего 2.8 годовых прибыли!!! Если это не буй, то вообще хз что такое буй.</div>",
     "publishedAt": "2022-04-14 12:24:32",
     "index": 7,
     "md5": "6957c4692cbad0aad0952d8d976116d0"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "Скрин из отчётности ДВМП (пароходик)  - прибыль на акцию в 2021 году =12.64 руб.- акция ща стоит 35.6 руб.- P/E = 2.8xПочему-то кажется, что в этом году из-за всего происходящего прибыль у пароходика может быть и побольше  ",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\">Скрин из отчётности ДВМП (пароходик) <i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F9186.png')\"><b>👆</b></i><br><br>- прибыль на акцию в 2021 году =12.64 руб.<br>- акция ща стоит 35.6 руб.<br>- P/E = 2.8x<br><br>Почему-то кажется, что в этом году из-за всего происходящего прибыль у пароходика может быть и побольше <i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F9A80.png')\"><b>🚀</b></i></div>",
     "publishedAt": "2022-04-14 12:29:25",
     "index": 8,
     "md5": "5badb884e25855a3b1c382c97ad5decb"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  Сборник. Акции ДВМП (FESH) могут вырасти в 3 раза.1. Бизнес компании вырастет на 100%, считают эксперты и источники, с которыми поговорили РДВ. В будущем для акций ДВМП это может означать кратный рост.2. Порты Дальнего Востока не справляются с большой нагрузкой. Цены на услуги компаний, входящих в группу ДВМП, выросли в 2-3 раза.3. О потенциале роста ДВМП пишут в Известиях: ДВМП   один из главных бенефициаров антироссийских санкций.4. ДВМП стоит 2.8 годовых прибылей 2021 года. Потенциал роста до аналогов более 70%.  Справедливая цена акций ДВМП (FESH) 97 рублей, потенциал роста +170%.@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F939A.png')\"><b>📚</b></i><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/E29A93.png')\"><b>⚓️</b></i> <b>Сборник.</b> <b>Акции ДВМП (<a href=\"https://putinomics.ru/dashboard/FESH/MOEX\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">FESH</a>) могут вырасти в 3 раза.</b><br><br>1. <a href=\"https://t.me/AK47pfl/11876\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">Бизнес компании вырастет на 100%</a>, считают эксперты и источники, с которыми поговорили РДВ. В будущем для акций ДВМП это может означать кратный рост.<br>2. Порты Дальнего Востока не справляются с <a href=\"https://t.me/AK47pfl/11878\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">большой нагрузкой</a>. Цены на услуги компаний, входящих в группу ДВМП, выросли в 2-3 раза.<br>3. О потенциале роста ДВМП пишут в Известиях: ДВМП — один из главных <a href=\"https://t.me/AK47pfl/11879\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">бенефициаров антироссийских санкций</a>.<br>4. ДВМП стоит 2.8 годовых прибылей 2021 года. <a href=\"https://t.me/finpizdec/9410\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">Потенциал роста</a> до аналогов более 70%.<br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F9189.png')\"><b>👉</b></i> <a href=\"https://t.me/AK47pfl/11877\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">Справедливая цена акций ДВМП (FESH) 97 рублей, потенциал роста +170%.</a><br><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-14 12:47:24",
     "index": 9,
     "md5": "5d895df54775ce8fc0300267ede40063"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  ДВМП (FESH): справедливая стоимость 97 руб., апсайд +175%.Рыночная цена акций стремится к их справедливой цене:  https://t.me/AK47pfl/9595#оценка #FESH @AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F94A6.png')\"><b>🔦</b></i><b> ДВМП (<a href=\"http://putinomics.ru/dashboard/FESH/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">FESH</a>): справедливая стоимость 97 руб., апсайд +175%.<br><br>Рыночная цена акций стремится к их справедливой цене:<br></b><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F9189.png')\"><b>👉</b></i><b> </b><a href=\"https://t.me/AK47pfl/9595\" target=\"_blank\" rel=\"noopener\">https://t.me/AK47pfl/9595</a><br><br><a href=\"?q=%23%D0%BE%D1%86%D0%B5%D0%BD%D0%BA%D0%B0\">#оценка</a> <a href=\"?q=%23FESH\">#FESH</a> <br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-14 12:52:55",
     "index": 10,
     "md5": "f61f1cfac11a21eb8d95a44e8b8306b5"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  Второй фронт для США: Китай собирается атаковать Тайвань? В случае военных действий на Тайване тема Украины уйдёт на второй план, а блок дружественных Китаю стран сплотится ещё сильнее.История Тайваня:В 1949 году после поражения в гражданской войне с материкового Китая на остров Тэйбэй сбежали остатки правительства. С тех пор на Тэйбэе развевается флаг прежней Китайской Республики, а ныне Тайваня. КНР считает остров мятежной провинцией и добивается воссоединения, не исключая для этого применения военной силы. США в этом конфликте выступают на стороне Тайваня, поставляя оружие и обещая защитить Тайвань в случае вторжения.Угроза китайской оккупации Тайваня встала особо остро после событий на Украине. Пекин может воспользоваться мировой нестабильностью и отвлечённым на это Западом. Народно-освободительная армия Китая (НОАК)   армия  1 в мире по численности военнослужащих: более 3.5 млн человек (в 10 раз больше, чем у Тайваня).Китай готовит почву к вторжению в Тайвань:  НОАК регулярно проводит учения по высадке на побережье (пока правда на своё, но прямо напротив Тэйбэя).  Китайские компании сокращают операции с Западом, чтобы не попасть под санкции в случае эскалации. Так, топ-3 китайский нефтяник рассматривает продажу активов в США, Британии и Канаде.  Власти Пекина постоянно предупреждают Запад, что Тайвань   это внутреннее дело Китая и вмешательство извне недопустимо.Тайвань уже начал готовиться к вторжению Китая:  Тайваньские военные выпустили руководство по ЧС. Оно предназначено для подготовки всех граждан на случай китайского вторжения на остров. 28-страничный буклет включает инструкции как найти бомбоубежища, накапливать запасы и оказывать первую помощь.   До этого военные Тайваня провели учения противовоздушной обороны для проверки готовности к отражению атаки с воздуха со стороны материкового Китая.США предупреждает вторжение Китая в Тайвань:  Сегодня конгрессмены США прибыли на Тайвань с необъявленным визитом.  Белый дом: США сделают всё возможное, чтобы не допустить воссоединения Тайваня с материковым Китаем силой.  Неделей ранее Нэнси Пелоси планировала визит в Тайвань. Но в последний момент поездка сорвалась «из-за положительного теста на Covid-19». Это произошло после угроз Пекина дать «военный ответ» США, расценив этот визит как покушение на территориальную целостность Китая.Если будет второй фронт для США, то дружественные Китаю страны сплотятся вокруг него ещё сильнее. Военный Китай может угрожать безопасности США не меньше, чем Россия, поэтому тема Украины отойдёт на второй план.@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F87A8F09F87B3.png')\"><b>🇨🇳</b></i><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F87B9F09F87BC.png')\"><b>🇹🇼</b></i> <b>Второй фронт для США: Китай собирается атаковать Тайвань?</b> В случае военных действий на Тайване тема Украины уйдёт на второй план, а блок дружественных Китаю стран сплотится ещё сильнее.<br><br><u>История Тайваня:<br></u>В 1949 году после поражения в гражданской войне с материкового Китая на остров Тэйбэй сбежали остатки правительства. С тех пор на Тэйбэе развевается флаг прежней Китайской Республики, а ныне Тайваня. КНР считает остров мятежной провинцией и добивается воссоединения, не исключая для этого применения военной силы. США в этом конфликте выступают на стороне Тайваня, поставляя оружие и обещая защитить Тайвань в случае вторжения.<br><br>Угроза китайской оккупации Тайваня встала особо остро после событий на Украине. Пекин может воспользоваться мировой нестабильностью и отвлечённым на это Западом. Народно-освободительная армия Китая (НОАК) — армия №1 в мире по численности военнослужащих: более 3.5 млн человек (<a href=\"https://ru.wikipedia.org/wiki/%D0%A1%D0%BF%D0%B8%D1%81%D0%BE%D0%BA_%D1%81%D1%82%D1%80%D0%B0%D0%BD_%D0%BF%D0%BE_%D1%87%D0%B8%D1%81%D0%BB%D0%B5%D0%BD%D0%BD%D0%BE%D1%81%D1%82%D0%B8_%D0%B2%D0%BE%D0%BE%D1%80%D1%83%D0%B6%D1%91%D0%BD%D0%BD%D1%8B%D1%85_%D1%81%D0%B8%D0%BB_%D0%B8_%D0%B2%D0%BE%D0%B5%D0%BD%D0%B8%D0%B7%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%BD%D1%8B%D1%85_%D1%84%D0%BE%D1%80%D0%BC%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B9\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">в 10 раз больше</a>, чем у Тайваня).<br><br><u>Китай готовит почву к вторжению в Тайвань:<br></u>• НОАК регулярно проводит учения по высадке на побережье (пока правда на своё, но прямо напротив Тэйбэя).<br>• Китайские компании сокращают операции с Западом, чтобы не попасть под санкции в случае эскалации. Так, топ-3 китайский нефтяник рассматривает <a href=\"https://tass.ru/ekonomika/14372537?utm_source=yxnews&amp;utm_medium=desktop\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">продажу активов в США</a>, Британии и Канаде.<br>• Власти Пекина постоянно предупреждают Запад, что Тайвань — это внутреннее дело Китая и вмешательство извне недопустимо.<br><br><u>Тайвань уже начал готовиться к вторжению Китая:<br></u>• Тайваньские военные <a href=\"https://www.reuters.com/world/asia-pacific/taiwan-issues-first-war-survival-handbook-amid-china-threat-2022-04-12/\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">выпустили руководство</a> по ЧС. Оно предназначено для подготовки всех граждан на случай китайского вторжения на остров. 28-страничный буклет включает инструкции как найти бомбоубежища, накапливать запасы и оказывать первую помощь. <br>• До этого военные Тайваня провели <a href=\"https://www.scmp.com/news/china/military/article/3173983/taipei-wakes-warplanes-overhead-military-drill-simulates-pla?module=lead_hero_story&amp;pgtype=homepage\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">учения противовоздушной обороны</a> для проверки готовности к отражению атаки с воздуха со стороны материкового Китая.<br><br><u>США предупреждает вторжение Китая в Тайвань:<br></u>• Сегодня конгрессмены США прибыли на Тайвань с необъявленным визитом.<br>• Белый дом: США сделают всё возможное, чтобы не допустить воссоединения Тайваня с материковым Китаем силой.<br>• Неделей ранее Нэнси Пелоси планировала визит в Тайвань. Но в последний момент поездка сорвалась «из-за положительного теста на Covid-19». Это произошло после угроз Пекина дать «военный ответ» США, расценив этот визит как покушение на территориальную целостность Китая.<br><br>Если будет второй фронт для США, то дружественные Китаю страны сплотятся вокруг него ещё сильнее. Военный Китай может угрожать безопасности США не меньше, чем Россия, поэтому тема Украины отойдёт на второй план.<br><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-14 17:01:52",
     "index": 11,
     "md5": "5bf35566329a412cf132a619ca49f34e"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  15.04.2022  Крейсер Москва затонул, о корабле.  Законопроект о внешнем управлении рассмотрят не раньше мая.  На совещании по ситуации в нефтегазовом секторе Владимир Путин объявил о планах увеличить долю расчетов в рублях.  Армения начала платить за российский газ в рублях.  Два конгрессмена США посетили Киев   первый визит официальных лиц с начала событий на Украине.  Китай проведет военные учения в районе Тайваня в ответ на действия США.  ВС Китая примут решительные меры против внешнего вмешательства и попыток отделить Тайвань. Ожидается:  Возможные операционные результаты за 1кв2022: Алроса (ALRS), Global Ports (GLPR), Северсталь (CHMF). Ранее ММК и НЛМК скрыли свои отчётности.#morning@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/E29880.png')\"><b>☀️</b></i> <b>15.04.2022</b><br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F87B7F09F87BA.png')\"><b>🇷🇺</b></i><br>• Крейсер Москва затонул, <a href=\"https://www.vedomosti.ru/politics/news/2022/04/15/918213-kreiser-moskva-zatonul\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">о корабле</a>.<br>• Законопроект <a href=\"https://www.vedomosti.ru/politics/articles/2022/04/14/918204-zakonoproekt-vneshnem-upravlenii\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">о внешнем управлении</a> рассмотрят не раньше мая.<br>• На совещании по ситуации в нефтегазовом секторе Владимир Путин объявил о планах увеличить <a href=\"https://www.vedomosti.ru/economics/articles/2022/04/14/918210-putin-uvelichit-raschetov\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">долю расчетов в рублях</a>.<br>• Армения начала платить за российский <a href=\"https://www.rbc.ru/business/15/04/2022/625865449a7947d679afc820\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">газ в рублях</a>.<br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F8C8E.png')\"><b>🌎</b></i><br>• Два конгрессмена <a href=\"https://www.nytimes.com/2022/04/14/world/europe/steve-daines-victoria-spartz-ukraine-kyiv.html\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">США посетили Киев</a> — первый визит официальных лиц с начала событий на Украине.<br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F87A8F09F87B3.png')\"><b>🇨🇳</b></i><br>• Китай проведет <a href=\"https://t.me/cbrstocks/35391\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">военные учения</a> в районе Тайваня в ответ на действия США.<br>• ВС Китая примут решительные меры <a href=\"https://t.me/cbrstocks/35392\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">против внешнего вмешательства</a> и попыток отделить Тайвань.<br><br><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/E29D97.png')\"><b>❗️</b></i><b>Ожидается:</b><br>• Возможные операционные результаты за 1кв2022: Алроса (ALRS), Global Ports (GLPR), Северсталь (CHMF). Ранее ММК и НЛМК скрыли свои отчётности.<br><br><a href=\"?q=%23morning\">#morning</a><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-15 09:30:27",
     "index": 12,
     "md5": "be1a4d8c48e8ce5a3abedfc10da66c49"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  Китай и Тайвань: военные учения в ответ на визит делегации США. Китайские военные направили фрегаты, бомбардировщики и истребители в Восточно-Китайское море и район вокруг Тайваня из-за «ошибочных сигналов» США по острову.МИД КНР требует от США прекратить все официальные контакты с Тайванем. «Уловки США совершенно бесполезны и очень опасны. Те, кто играет с огнем, сожгут себя»,   говорится в сообщении.Минобороны КНР сообщает, что визит США был «намеренно провокационным» и «привел к дальнейшей эскалации напряженности в Тайваньском проливе». Армия Китая обещает принять все меры, чтобы не допустить попыток организовать независимость Тайваня.Ранее РДВ: Второй фронт для США: Китай собирается атаковать Тайвань?@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/E29AA1.png')\"><b>⚡️</b></i><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F87A8F09F87B3.png')\"><b>🇨🇳</b></i> <b>Китай и Тайвань:</b> <b>военные учения в ответ на визит делегации США.</b> Китайские военные направили фрегаты, бомбардировщики и истребители в Восточно-Китайское море и район вокруг Тайваня из-за «ошибочных сигналов» США по острову.<br><br>МИД КНР требует от США прекратить все официальные контакты с Тайванем. <i>«Уловки США совершенно бесполезны и очень опасны. <u>Те, кто играет с огнем, сожгут себя</u>»,</i> — говорится в сообщении.<br><br>Минобороны КНР сообщает, что визит США был «намеренно провокационным» и «привел к дальнейшей эскалации напряженности в Тайваньском проливе». Армия Китая обещает принять все меры, чтобы не допустить попыток организовать независимость Тайваня.<br><br><a href=\"https://t.me/AK47pfl/11884\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">Ранее РДВ:</a> Второй фронт для США: Китай собирается атаковать Тайвань?<br><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-15 11:04:03",
     "index": 13,
     "md5": "d349f973e36803935c3c6513fad687b7"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "РынкиДеньгиВласть | РДВ pinned «  Второй фронт для США: Китай собирается атаковать Тайвань? В случае военных действий на Тайване тема Украины уйдёт на второй план, а блок дружественных Китаю стран сплотится ещё сильнее.  История Тайваня: В 1949 году после поражения в гражданской войне »",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><a class=\"tgme_widget_message_author_name\" href=\"https://t.me/AK47pfl\"><span dir=\"auto\">РынкиДеньгиВласть | РДВ</span></a> pinned «<span class=\"tgme_widget_service_strong_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F87A8F09F87B3.png')\"><b>🇨🇳</b></i><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F87B9F09F87BC.png')\"><b>🇹🇼</b></i> Второй фронт для США: Китай собирается атаковать Тайвань? В случае военных действий на Тайване тема Украины уйдёт на второй план, а блок дружественных Китаю стран сплотится ещё сильнее.  История Тайваня: В 1949 году после поражения в гражданской войне…</span>»</div>",
     "publishedAt": "2022-04-15 11:04:14",
     "index": 14,
     "md5": "230358fc95632b03addd87e518921c45"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  Ключевые цифры Тайваня: за чем гонится Китай. История Тайваня.Население   Всего 23.3 млн чел    56 в мире, и больше не растёт  Доля городского населения 83% (в Китае 64%, в России 75%)  Медианный возраст 42 года (в Китае 38 лет, в России 40 лет)Экономика  ВВП $785 млрд    23  ВВП на душу населения $33.4 тыс.    40  Уровень безработицы ~3.7%  Государственный долг 28% ВВП  Валютные резервы $549 млрд (70% ВВП)Экспорт товаров $446 млрд    15 в мире.  38.5% экспорта   электронные компоненты (микросхемы, транзисторы, полупроводники и т.п.) с экспортом микрочипов  1.Основные партнеры:  42.3% экспорта   Китай и Гонконг, (импорт   22.1%)  14.7% США (импорт   10.3%)  6.5% Япония (импорт   14.7%)  0.3% Россия (импорт   1.3%)Ценные для мира активы.  TSMC, компания  10 в мире по капитализации   крупнейший и наиболее передовой производитель полупроводников с долей рынка 26%. Основной конкурент Samsung.  Foxconn   главный сборщик продукции Apple c долей 40% на рынке электроники.@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F87B9F09F87BC.png')\"><b>🇹🇼</b></i> <b>Ключевые цифры Тайваня: за чем гонится Китай.</b> <a href=\"https://t.me/AK47pfl/11884\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">История Тайваня</a>.<b><br></b><br><b>Население <br></b>• Всего 23.3 млн чел — <a href=\"https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations)\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">№56 в мире</a>, и больше <a href=\"https://www.statista.com/statistics/319793/taiwan-population/\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">не растёт</a><br>• Доля городского населения 83% (в Китае 64%, в России 75%)<br>• Медианный возраст <a href=\"https://knoema.ru/atlas/%D0%A2%D0%B0%D0%B9%D0%B2%D0%B0%D0%BD%D1%8C/topics/%D0%94%D0%B5%D0%BC%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D1%8F/%D0%92%D0%BE%D0%B7%D1%80%D0%B0%D1%81%D1%82/%D0%9C%D0%B5%D0%B4%D0%B8%D0%B0%D0%BD%D0%BD%D1%8B%D0%B9-%D0%B2%D0%BE%D0%B7%D1%80%D0%B0%D1%81%D1%82-%D0%BD%D0%B0%D1%81%D0%B5%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">42 года</a> (в Китае <a href=\"https://knoema.ru/atlas/%D0%9A%D0%B8%D1%82%D0%B0%D0%B9/topics/%D0%94%D0%B5%D0%BC%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D1%8F/%D0%92%D0%BE%D0%B7%D1%80%D0%B0%D1%81%D1%82/%D0%9C%D0%B5%D0%B4%D0%B8%D0%B0%D0%BD%D0%BD%D1%8B%D0%B9-%D0%B2%D0%BE%D0%B7%D1%80%D0%B0%D1%81%D1%82-%D0%BD%D0%B0%D1%81%D0%B5%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F#:~:text=%D0%9A%D0%B8%D1%82%D0%B0%D0%B9%20-%20%D0%9C%D0%B5%D0%B4%D0%B8%D0%B0%D0%BD%D0%BD%D1%8B%D0%B9%20%D0%B2%D0%BE%D0%B7%D1%80%D0%B0%D1%81%D1%82%20%D0%BE%D0%B1%D1%89%D0%B5%D0%B3%D0%BE\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">38 лет</a>, в России 40 лет)<br><br><b>Экономика<br></b>• ВВП $785 млрд — <a href=\"https://en.wikipedia.org/wiki/List_of_countries_by_GDP_(nominal)\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">№23<br></a>• ВВП на душу населения $33.4 тыс. — <a href=\"https://en.wikipedia.org/wiki/List_of_countries_by_GDP_(nominal)_per_capita\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">№40<br></a>• Уровень <a href=\"https://ru.tradingeconomics.com/taiwan/unemployment-rate\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">безработицы</a> ~3.7%<br>• Государственный долг 28% ВВП<br>• Валютные <a href=\"https://take-profit.org/statistics/foreign-exchange-reserves/taiwan/\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">резервы</a> $549 млрд (70% ВВП)<br><br><b>Экспорт</b> товаров <a href=\"https://service.mof.gov.tw/public/Data/statistic/trade/news/11012/11012_%E8%8B%B1%E6%96%87%E6%96%B0%E8%81%9E%E7%A8%BF.pdf\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">$446 млрд</a> — <a href=\"https://stats.wto.org/\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">№15</a> в мире.<br>• 38.5% экспорта — электронные компоненты (микросхемы, транзисторы, полупроводники и т.п.) с экспортом микрочипов <a href=\"https://oec.world/en/visualize/tree_map/hs92/export/show/all/168542/2020/\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">№1</a>.<br><br><b>Основные партнеры:</b><br>• 42.3% экспорта — Китай и Гонконг, (импорт — 22.1%)<br>• 14.7% США (импорт — 10.3%)<br>• 6.5% Япония (импорт — 14.7%)<br>…<br>• 0.3% Россия (импорт — 1.3%)<br><br><b>Ценные для мира</b> <b>активы</b>.<br>• TSMC, компания №10 в мире по капитализации — крупнейший и наиболее передовой производитель полупроводников <a href=\"https://investor.tsmc.com/sites/ir/annual-report/2021/2021%20Annual%20Report_E.pdf\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">с долей рынка 26%</a>. Основной конкурент Samsung.<br>• Foxconn — главный сборщик продукции Apple c долей <a href=\"https://image.honhai.com/financy_by_year/%E9%B4%BB%E6%B5%B7109%E5%B9%B4%E5%A0%B1_EN-v2_(2).pdf\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">40% на рынке электроники</a>.<br><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-15 11:10:00",
     "index": 15,
     "md5": "14e44b500c893470087c82027e392123"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  Частные инвесторы как класс перестали покупать акции. Весь рынок в марте выкупали крупнейшие банки. ЦБ выпустил отчёт о рынке РФ за февраль-март.В феврале на частных инвесторов пришёлся основной спрос на акции, они покупали в противовес продажам иностранцев. А в марте наоборот   физлица продали больше, чем купили (см. график).Основными покупателями стали банки (СЗКО*), которые выкупали акции у всех других участников рынка. Всего российские банки в марте купили акций на 46 млрд рублей.А основными продавцами   некредитные финансовые организации (НФО), а именно, преимущественно, профучастники РЦБ, управляющие компании, паевые фонды. Они продали акций на 20.9 млрд  руб.*Системно значимые кредитные организации (СЗКО)   13 крупнейших банков РФ, в их числе: ВТБ, Сбер, Тинькофф, Альфа и др.@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F94A5.png')\"><b>🔥</b></i> <b>Частные инвесторы как класс перестали покупать акции</b>. <b>Весь рынок в марте выкупали</b> <b>крупнейшие банки.</b> ЦБ выпустил <a href=\"http://www.cbr.ru/Collection/Collection/File/40925/ORFR_2022-02-03.pdf\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">отчёт о рынке</a> РФ за февраль-март.<br><br>В феврале на частных инвесторов пришёлся основной спрос на акции, они покупали в противовес продажам иностранцев. А в марте наоборот — физлица продали больше, чем купили (см. график).<br><br><u>Основными покупателями</u> стали банки (СЗКО*), которые выкупали акции у всех других участников рынка. Всего российские банки в марте купили акций на 46 млрд рублей.<br><br><u>А основными продавцами</u> — некредитные финансовые организации (НФО), а именно, преимущественно, профучастники РЦБ, управляющие компании, паевые фонды. Они продали акций на 20.9 млрд  руб.<br><br><i>*Системно значимые кредитные организации (СЗКО) — <a href=\"https://cbr.ru/banking_sector/credit/SystemBanks.html/\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">13 крупнейших банков РФ</a>, в их числе: ВТБ, Сбер, Тинькофф, Альфа и др.</i><br><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-15 11:46:40",
     "index": 16,
     "md5": "38ec0cfda4cd584541116b7c04d4e908"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  После открытия рынка в марте акции покупали массовые инвесторы, а наиболее богатые   продавали. Это следует из отчёта ЦБ о рынке РФ за февраль-март.Продажи акций осуществлялись со стороны инвесторов с крупными позициями, в то время как физлица с более скромным портфелем предпочитали приобретать акции. Суммарно в марте продажи частных инвесторов превысили покупки.Один и тот же объём в рублях, в среднем, продавало в 3 раза меньше частных инвесторов, чем покупало (см. таблицу).@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F90B9.png')\"><b>🐹</b></i> <b>После открытия рынка</b> <b>в марте</b> <b>акции покупали массовые инвесторы, а наиболее богатые — продавали.</b> Это следует из отчёта ЦБ <a href=\"http://www.cbr.ru/Collection/Collection/File/40925/ORFR_2022-02-03.pdf\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">о рынке</a> РФ за февраль-март.<br><br>Продажи акций осуществлялись со стороны инвесторов с крупными позициями, в то время как физлица с более скромным портфелем предпочитали приобретать акции. <a href=\"https://t.me/AK47pfl/11889\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">Суммарно в марте</a> продажи частных инвесторов превысили покупки.<br><br>Один и тот же объём в рублях, в среднем, продавало в 3 раза меньше частных инвесторов, чем покупало (см. таблицу).<br><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-15 12:29:27",
     "index": 17,
     "md5": "5f8503c469638e3998fe9ef9a38cdf7a"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "  РДВ и вице-премьер РФ Александр Новак про отказ Европы от российских энергоносителей.Газ  Новак: У ЕС недостаточно инфраструктуры, чтобы заменить российский газ СПГ.  РДВ: Европе не заменить российский газ на СПГ в ближайшие годы.Нефть  Новак: Российские нефть и газ не заменить на горизонте 5-10 лет. Крупные ограничения поставок чреваты новыми рекордами цен.  РДВ: 5 почему ЕС не может немедленно отказаться от импорта российской нефти и нефтепродуктов. Даже спекуляции о возможном запрете приводят к резкому росту цен на нефть.@AK47pfl",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F8F86.png')\"><b>🏆</b></i> <b>РДВ и вице-премьер РФ Александр Новак про отказ Европы от российских энергоносителей.</b><br><br><u>Газ</u><br>• <a href=\"https://t.me/cbrstocks/35420\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">Новак:</a> У ЕС недостаточно инфраструктуры, чтобы заменить российский газ СПГ.<br>• <a href=\"https://t.me/AK47pfl/11743\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">РДВ:</a> Европе не заменить российский газ на СПГ в ближайшие годы.<br><br><u>Нефть</u><br>• <a href=\"https://t.me/cbrstocks/35420\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">Новак:</a> Российские нефть и газ не заменить на горизонте 5-10 лет. Крупные ограничения поставок чреваты новыми рекордами цен.<br>• <a href=\"https://t.me/AK47pfl/11733\" target=\"_blank\" rel=\"noopener\" onclick=\"return confirm('Open this link?\\n\\n'+this.href);\">РДВ:</a> 5 почему ЕС не может немедленно отказаться от импорта российской нефти и нефтепродуктов. Даже спекуляции о возможном запрете приводят к резкому росту цен на нефть.<br><br><a href=\"https://t.me/AK47pfl\" target=\"_blank\">@AK47pfl</a></div>",
     "publishedAt": "2022-04-15 15:00:48",
     "index": 18,
     "md5": "4833e028b5c0bd42c8c3150c21d66851"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 },
 {
  "service": {
   "scraper": {
    "message": {
     "text": "#MTSS  В повестку годового собрания МТС 22 июня будет включен вопрос о дивидендах за 2021 финансовый год.",
     "html": "<div class=\"tgme_widget_message_text js-message_text\" dir=\"auto\"><a href=\"?q=%23MTSS\">#MTSS</a><br><b><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/E29AA1.png')\"><b>⚡️</b></i><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/E29AA1.png')\"><b>⚡️</b></i> В повестку годового собрания МТС 22 июня будет включен вопрос о дивидендах за 2021 финансовый год</b>.</div>",
     "publishedAt": "2022-04-15 15:26:27",
     "index": 19,
     "md5": "31581aa94389e3c222cde3f625f6205a"
    },
    "page": {
     "title": "РынкиДеньгиВласть | РДВ",
     "description": "<div class=\"tgme_channel_info_description\"><i class=\"emoji\" style=\"background-image:url('//telegram.org/img/emoji/40/F09F949D.png')\"><b>🔝</b></i> аналитика по российскому рынку ценных бумаг, которая ранее была доступна лишь финансовым элитам. Впереди брокеров и банков.<br><br>Стратегические вопросы: <a href=\"https://t.me/dragonwoo\" target=\"_blank\">@dragonwoo</a><br><br>Реклама - агент PR Fintech: <a href=\"https://t.me/arina_promo\" target=\"_blank\">@arina_promo</a><br><br>Сервис для инвесторов и трейдеров <a href=\"https://t.me/RDVPREMIUMbot\" target=\"_blank\">@RDVPREMIUMbot</a></div>",
     "image": "https://cdn4.telegram-cdn.org/file/X3RZTkJ6BTu6VcpAiW3OCGxjezSTNGTyuW6BsBFNFsakzKUZyPc1c-RWWWdUic7HIDYiT5ygx44S6tAjy7L2GeNw3egyZtvz0FKkCagmo2mf3B4VZKvJ1mUVaKDiiaPwcA1xTKbxCeRfRGjmzLSesiRxu-gVrLnzD7oZ62tXaKDqaqLcw_dazSi_6rFjUnQRKoIJ2LPdPwjlHiR8cqN7VnD4RbGlNEf6h39my38JIFcdO_F28pO4_c3uds5eJVfqv3fM6WaOFonRaR3QnopWKTnU8jJTa6Vc9NfGxp9-F9MnqXYhwES98VpwgFudCUS60MrcMQSXBxS_IQOfQh_eAg.jpg"
    }
   },
   "scheduler": {
    "task": {
     "params": {
      "type": "telegram",
      "channel": "AK47pfl"
     },
     "state": "processed",
     "processedAt": "2022-04-15 17:38:29"
    }
   }
  }
 }
]
---------------------------------------------------------------  

```
                                                        
                                                                                                                                  
- use:                                                                                                                            
    # Использование HTTP-запросов                                                                                                 
    - axios-plugin                                                                                                                
    # Использование библиотеки cheerio                                                                                            
    - cheerio-plugin                                                                                                              
    # Использование js-инъекций                                                                                                   
    - js-plugin                                                                                                                   

...

                                                                                                                                  
# Возвращаем из сценария скрапинга значение "messages"                                                                            
- return: messages                                                                                                                
---------------------------------------------------------------                                                                   
Call with params: D:\MOLFAR\scanany-scripts\test\params\tg1.params.yml                                                            
                                                                                                                                  
# Параметри, які передаються в скрипт                                                                                             
# Доступ до них здійснюється за допомогою $ref                                                                                    
# Наприклад                                                                                                                       
# - $ref: params.channel # ("AK47pfl")                                                                                            
#       transform:                                                                                                                
#         js: (command, context, value) => `https://t.me/s/${value}` # ("https://t.me/s/AK47pfl")                                 
#       into: params.url                                                                                                          
                                                                                                                                  
params:                                                                                                                           
  type: telegram                                                                                                                  
  channel: AK47pfl                                                                                                                
---------------------------------------------------------------                                                                   
Scanany result:                                                                                                                   
                                                                                                                                  
[                                                                                                                                 
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Геополитический апдейт: пока ситуация развивается по дипломатическому пути.  Последние события:  Байден: говорил

 ...     

```

Приклади скриптів та використання plugins можна знайти [тут](https://github.com/boldak/scanany/tree/master/examples/yaml) або на [онлайн-сервісі](http://scanany.herokuapp.com)