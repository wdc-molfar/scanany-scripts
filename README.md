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

Наприклад виконання:

```sh

npm run debug ./src/scanany/telegram.yml

```

дає:

```sh

D:\MOLFAR\scanany-scripts>npm run debug ./src/scanany/telegram.yml                                                                
                                                                                                                                  
> @molfar/scanany-scripts@1.0.0 debug D:\MOLFAR\scanany-scripts                                                                   
> node ./node_modules/@molfar/scanany/example "./src/scanany/telegram.yml"                                                        
                                                                                                                                  
---------------------------------------------------------------                                                                   
Scanany example: D:\MOLFAR\scanany-scripts\src\scanany\telegram.yml                                                               
                                                                                                                                  
- use: 
    # Использование HTTP-запросов    
    - axios-plugin
    # Использование библиотеки cheerio
    - cheerio-plugin
    # Использование js-инъекций
    - js-plugin


- log:
    - $const: DEBUG >> Scanany script settings
    - $ref: service

# готовим входные данные для скрапинга
# формируем структуру params
- map:

    # ЭТОТ БЛОК НУЖЕН ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ
    # - $const: 
    #     type: telegram
    #     # имя канала (в примере "AK47pfl")
    #     channel: AK47pfl
    #   into: params
    
    # формируем url - https://t.me/s/<<имя канала>> 
    - $ref: service.scheduler.task.params.channel
      transform:
        js: (command, context, value) => `https://t.me/s/${value}`
      into: url
    
    # формируем текущую дату в формате "YYYY-MM-DD HH:mm:ss"
    # помещаем в params.createdAt
    - transform:
        apply:
          - date
          - moment.format: YYYY-MM-DD HH:mm:ss    
      into: service.scheduler.task.processedAt

    - $const: processed
      into: service.scheduler.task.state            

# ОТЛАДКА - вывод значения "url" (отключена)
# - log:
#     - $const: "URL:"
#     - $ref: url  

# Выбираем данные из источника
- fetch:
    request:
      method: GET
      url: 
        $ref: url
    # преобразуем ответ (response)       
    transform:
      apply:
        # выбираем значение response.data       
        - project: data
        # преобразуем в объект cheerio       
        - html->$
    # результат преобразования записываем в переменную "page"       
    into: page

# Выбираем из "page" элемент DOM (один, первый) для заголовка канала
# CSS-селектор: "div.tgme_channel_info_header_title > span"  
- once:
    $ref: page
    select: div.tgme_channel_info_header_title > span
    apply:
      # преобразуем выбранный элемент в текст     
      transform: text
      # записываем в "p.title"
      into: p.title

# Выбираем из "page" элемент DOM для описания канала
# CSS-селектор: "div.tgme_channel_info_description"  
- once:
    $ref: page
    select: div.tgme_channel_info_description
    apply:
      # преобразуем выбранный элемент в html     
      transform: html
      # записываем в "p.description"
      into: p.description

# Выбираем из "page" элемент DOM для аватара канала
# CSS-селектор: "div.tgme_channel_info > div.tgme_channel_info_header > i > img"  
- once:
    $ref: page
    select: div.tgme_channel_info > div.tgme_channel_info_header > i > img
    apply:
       -  transform: 
            apply:
              # выбираем из выбранного элемента атрибут "src" -> { src: "<<value>>"}    
              - attributes: src
              # возвращаем значение поля "src" 
              - project: src 
          # записываем результат преобразования в "p.image"
          into: p.image
        
# Выбираем из "page" все элементы DOM сообщений
# CSS-селектор: "div.tgme_widget_message_bubble"
# Записываем коллекцию элементов в "res"   
- all:
    $ref: page
    select: div.tgme_widget_message_bubble
    into: res
        
# Для каждого элемента из коллекции "res", именуемого как "item"
# Выполнить действия и результат записать в "messages"   
- each:
    in:
      $ref: res
    as: item
    indexed-by: index
    into: messages
    
    # применить к текущему элементу - "item"
    apply:
      
      # преобразуем item -> html -> объект cheerio
      # результат - в "msg"
      - map:
          $ref: item
          transform: 
            apply:
              - html
              - html->$
          into: msg
      
      # Выбираем из "msg" элемент DOM с текстом сообщения
      # CSS-селектор: "div.tgme_widget_message_text"
      - once:
          $ref: msg
          select: div.tgme_widget_message_text
          apply:  
            
            # выбранный элемент преобразуем в текст и помещаем в "message.metadata.text"
            - transform: 
                apply:
                  - text
                  - js: '(command, context, value) => value.replace(/[\u2000-\uffff]+/g, " ")'
              into: message.text
            
            # его же преобразуем в html и помещаем в "message.metadata.html"
            - transform: html
              into: message.html
      
      # Выбираем из "msg" элемент DOM с датой публикации
      # CSS-селектор: "time"
      - once:
          $ref: msg
          select: time
          apply:
            - transform: 
                
                # Забираем из выбранного элемента атрибут "datetime" и преобразуем его в формат "YYYY-MM-DD HH:mm:ss"         
                apply:
                  - attributes: datetime
                  - project: datetime
                  - date
                  - moment.format: YYYY-MM-DD HH:mm:ss
              # результат - в "message.metadata.publishedAt"
              into: message.publishedAt
      
      # Перекидываем из "params" в "message" необходимые атрибуты
      - map: 

      #   - $ref: params.type
      #     into: message.type

      #   - $ref: params.channel
      #     into: message.channel
        
      #   - $ref: params.url
      #     into: message.url
        
      #   - $ref: params.createdAt
      #     into: message.createdAt

        # Преобразуем message.metadata.text в сигнатуру md5 и записываем в message.md5 
        # (получаем уникальный ID на основе контента)
        
        - $ref: index
          into: message.index

        - $ref: message.text
          transform: md5
          into: message.md5

        - $ref: message
          into: m.service.scraper.message  

        - $ref: p
          into: m.service.scraper.page 

        - $ref: service.scheduler
          into: m.service.scheduler    
      # Возвращаем из обработки текущего элемента "item" значение "message"  
      - return: m          

# Возвращаем из сценария скрапинга значение "messages"  
- return: messages                                                                                                                 
---------------------------------------------------------------                                                                   
Scanany result:                                                                                                                   
                                                                                                                                  
[                                                                                                                                 
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Геополитический апдейт: Россия смягчила риторику, США и ЕС дают деньги Украине.  Последние события:  Лавров Путину: шанс [договориться] есть всегда.  Пентагон для CNN: мы согласны со взглядами Лаврова, все еще есть время и пространство для дипломатии.  Песков для CNN: Путин готов вести переговоры по Украине и гарантиям безопасности.  Шойгу Путину: часть учений будет завершена в ближайшее время.  Зеленский: три наши дружественные страны нагнетают историю с войной. Нами играют, но мы сопротивляемся.  Канцлер Германии Шольц: Украина вынесет на обсуждение законопроекты по особому статусу Донбасса.  Постпред РФ при ЕС Чижов: если украинцы нападут на Россию, не стоит удивляться, если мы ответим.  Блинкен: США предложили Украине кредитные гарантии на сумму до $1 млрд.  Европарламент: ЕС предоставит Украине кредиты и гранты в размере  1.2 млрд. Ожидается сегодня:  Рассмотрение Советом Думы 
вопроса обращения к Путину по признанию ЛДНР.  Встреча Путина и Шольца в Москве.  Запрошенные Киевом консультации по Венскому документу в ОБСЕ.@AK47pfl',                                                                                                           
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F8C8F.png')"><b>�</b></i> <b>Геополитический апдейт: Россия смягчила риторику, США и ЕС дают деньги Укра 
ине.</b><br><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09FA58A.png')"><b>�</b></i><b> Последн 
ие события:</b><br>• <a href="http://kremlin.ru/events/president/news/67766" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Лавров Путину</a>: шанс [договориться] есть всегда.<br>• <a href="https://edition.cnn.com/europe/live-news/ukraine-russia-news-02-14-22-intl/index.html" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Пентагон для CNN</a>: мы согласны со взглядами Лаврова, все еще есть время и пространство для дипломатии.<br>• <a href="https://edition.cnn.com/europe/live-news/ukraine-russia-news-02-14-22-intl/index.html" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Песков для CNN</a>: Путин готов вести переговоры по Украине и гарантиям безопасности.<br>• <a href="http://kremlin.ru/events/president/news/67767" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Шойгу Путину</a>: часть учений будет завершена в ближайшее время.<br>• <a href="https://ria.ru/20220215/skandal-1772821773.html?utm_source=yxnews&amp;utm_medium=desktop" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Зеленский</a>: три наши дружественные страны нагнетают историю с войной. Нами играют, 
но мы сопротивляемся.<br>• <a href="https://tass.ru/mezhdunarodnaya-panorama/13705273?utm_source=yxnews&amp;utm_medium=desktop" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Канцлер Германии Шольц</a>: Украина вынесет на обсуждение законопроекты по особому статусу Донбасса.<br>• <a href="https://www.rbc.ru/politics/15/02/2022/620b47899a794751ec5042d8" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Постпред РФ при ЕС Чижов</a>: если украинцы нападут на Россию, не стоит удивляться, если мы ответим.<br>• <a href="https://www.state.gov/u-s-action-to-strengthen-ukraines-economy/" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Блинкен</a>: США предложили Украине кредитные гарантии на сумму до $1 млрд.<br>• <a href="https://tass.ru/ekonomika/13709409" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Европарламент</a>: ЕС предоставит Украине <a href="https://www.rbc.ru/politics/24/01/2022/61ee9c349a794715334d983f" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">кредиты и гранты</a> в размере €1.2 млрд.<br><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/E29D97.png')"><b>❗н                                                                                                
у по признанию ЛДНР.<br>• Встреча Путина и Шольца в Москве.<br>• Запрошенные Киевом консультации по Венскому документу в ОБСЕ.<br><br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,                                                           
      publishedAt: '2022-02-15 10:00:01'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '19d33e5cbc05a63d97144a47faf8afcf'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '#Политика  Российские военные завершили ряд учений, ожидается их возвращение домой   Интерфакс',                     
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><a href="?q=%23%D0%9F%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0">#Политика</a><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F87B7F09F87BA.png')"><b>��</b></i> <b>Российские военные завершили ряд учений, ожидается их возвращение домой </b>— Интер  факс</div>`,                  
      publishedAt: '2022-02-15 10:08:07'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: 'd19c9177a790aa9099fabe140adae4f5'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '#Макро  Рынок США отреагировал ростом на заявления Минобороны РФФьючерсы на индекс Nasdaq выросли почти на 1% после заявление об отводе части российских войск.',                                                                                      
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><a href="?q=%23%D0%9C%D0%B0%D0%BA%D1%80%D0%BE">#Макро</a><br><b><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/E29AA1.png')"><b>⚡г                        
ировал ростом на <a href="https://t.me/cbrstocks/31917" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">заявления</a> Минобороны РФ<br><br></b>Фьючерсы на индекс Nasdaq выросли почти на 1% после заявление об отводе части российских войск.</div>`,                                                                                                    
      publishedAt: '2022-02-15 10:24:31'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: 'dbda4c146b61ee7654aa372839b5f7fa'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  История повторяется? В прошлом году рынок РФ продолжил рост после заявлений об отводе войск.22 апреля 2021 года Шойгу приказал вернуть войска с учений на юге РФ. После этого рубль перешёл к укреплению, а рынок к росту (см. график индекса РТС).Сейчас ВС РФ завершили ряд учений и возвращаются в пункты постоянной дислокации. На этих новостях рубль укрепился на 1%, а нефть упала ниже $95.@AK47pfl',                                                                                                            
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94A5.png')"><b>�</b></i><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F9 
4A5.png')"><b>�</b></i><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94A5.png')"><b>�</b></i> <b  
>История повторяется?</b> В прошлом году рынок РФ продолжил рост после заявлений об отводе войск.<br><br><b>22 апреля 2021 года</b> Шойгу <a href="https://t.me/cbrstocks/19517" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">приказал</a> вернуть войска с учений на юге РФ. После этого рубль <a href="https://t.me/cbrstocks/19519" target="_blank" 
rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">перешёл</a> к укреплению, а рынок к росту (см. график 
индекса РТС).<br><br><b>Сейчас</b> ВС РФ завершили ряд учений и <a href="https://t.me/cbrstocks/31917" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">возвращаются</a> в пункты постоянной дислокации. На этих новостях рубль <a href="https://t.me/cbrstocks/31920" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">укрепился</a> на 1%, а нефть <a href="https://t.me/cbrstocks/31922" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">упала</a> ниже $95.<br><br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,                                                                                                                                
      publishedAt: '2022-02-15 10:51:28'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '7f8173c038d37f9ccc5a8824b99983a4'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '#Политика Госдума проголосовала за обращение Госдумы напрямую к президенту РФ о необходимости признания ЛДНР',       
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><b><a href="?q=%23%D0%9F%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0">#Политика</a><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/E29AA1.png')"><b>⚡>   
</i>Госдума проголосовала за обращение Госдумы напрямую к президенту РФ о необходимости признания ЛДНР</b></div>`,                
      publishedAt: '2022-02-15 12:23:54'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '120764428b7105fd0e46af3a3ffea817'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '#Политика  Киев будет расценивать признание Москвой ДНР и ЛНР как выход РФ из Минских соглашений   глава МИД Украины',                                                                                                                                 
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><a href="?q=%23%D0%9F%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0">#Политика</a><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/E29AA1.png')"><b>⚡i      
> <b>Киев будет расценивать признание Москвой ДНР и ЛНР как выход РФ из Минских соглашений </b>— глава МИД Украины</div>`,        
      publishedAt: '2022-02-15 12:30:06'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '5f0f6a2c05c60f41e385c650f76b9d46'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Российский рынок реагирует хорошим ростом на любые новости о деэскалации. Российский рынок сегодня показывает значительный рост на фоне отвода части войск РФ: индекс Мосбиржи +3.5%, РТС +5%.  Большинство акций российского рынка закрыли пятничное падение на обострении геополитической обстановки. Геополитика остается главным драйвером движения рынков.#рынок_рф@AK47pfl',     
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><b><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F87B7F09F87BA.png')"><b>��</b></i> Российский рынок реагирует хорошим   ростом на любые новости о деэскалации. </b>Российский рынок сегодня показывает значительный рост на фоне отвода части войск РФ: индекс Мосбиржи +3.5%, РТС +5%. 
 Большинство акций российского рынка закрыли пятничное падение на обострении геополитической обстановки. Геополитика остается главным драйвером движения рынков.<br><br><a href="?q=%23%D1%80%D1%8B%D0%BD%D0%BE%D0%BA_%D1%80%D1%84">#рынок_рф</a><br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,                                                                              
      publishedAt: '2022-02-15 16:51:47'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '2a303bcf68b4ed98b22854f95de1835e'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Топ-30 российских компаний по капитализации. По состоянию на 15 февраля 2021 (в $ млрд), а также изменение их места в рейтинге с 17 ноября 2021 года.1. Газпром (GAZP) 103.52. Сбер (SBER) 80.23. Роснефть (ROSN) 78.94. Новатэк (NVTK) 64.35. Лукойл (LKOH) 64.06. Норникель (GMKN) 44.47. Газпром-нефть (SIBN) 32.38. Полюс (PLZL) 22.59. Сургут (SNGS) 20.7  +110. НЛМК (NLMK) 18.5 
 +311. Яндекс (YNDX) 18.5  -212. Северсталь (CHMF) 18.113. Русал (RUAL) 17.3  +214. Татнефть (TATN) 15.1 15. Транснефть (TRNF) 14.5  +116. TCS Group (TCSG) 14.2  -517. Алроса (ALRS) 11.218. ММК (MAGN) 9.6  +219. Фосагро (PHOR) 9.0  +320. Акрон (AKRN) 8.4  +921. ПИК (PIKK) 8.2  -322. En+ (ENPG) 8.1  +623. МТС (MTSS) 7.7  +324. ВСМПО(VSMO) 7.4  +625. Полиметалл (POLY) 7.2  -626. ВТБ (VTBR) 7.0  -527. Магнит (MGNT) 7.0  -328. Евраз (EVR) 6.5  -1029. X5 Retail (FIVE) 6.4  -330. Fix Price (FIXP) 5.3  Из топ-30 выпал Arrival с $2.5 млрд капитализации.Капитализация компаний по состоянию на 17 ноября 2021   здесь.#цифры@AK47pfl',                     
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F938C.png')"><b>�</b></i> <b>Топ-30 российских компаний по капитализации. </b>По состоянию на 15 февраля 
 2021 (в $ млрд), а также изменение их места в рейтинге с 17 ноября 2021 года.<br><br>1. Газпром (<a href="http://putinomics.ru/dashboard/GAZP/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">GAZP</a>) 103.5<br>2. Сбер (<a href="http://putinomics.ru/dashboard/SBER/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">SBER</a>) 80.2<br>3. Роснефть (<a href="http://putinomics.ru/dashboard/ROSN/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">ROSN</a>) 78.9<br>4. Новатэк (<a href="http://putinomics.ru/dashboard/NVTK/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">NVTK</a>) 64.3<br>5. Лукойл (<a href="http://putinomics.ru/dashboard/LKOH/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">LKOH</a>) 64.0<br>6. Норникель (<a href="http://putinomics.ru/dashboard/GMKN/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">GMKN</a>) 44.4<br>7. Газпром-нефть (<a href="http://putinomics.ru/dashboard/SIBN/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">SIBN</a>) 32.3<br>8. Полюс (<a href="http://putinomics.ru/dashboard/PLZL/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" 
target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">PLZL</a>) 22.5<br>9. Сургут (<a href="http://putinomics.ru/dashboard/SNGS/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" 
onclick="return confirm('Open this link?\\n\\n'+this.href);">SNGS</a>) 20.7 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BA.png')"><b>�</b></i>+1<br>10. НЛМК (<a href="http://putinomics.ru/dashboard/NLMK/MOEX?utm_source=tg&a 
mp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">NLMK</a>) 18.5 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BA.png')"><b>�</b></i>+3<br>1 
1. Яндекс (<a href="http://putinomics.ru/dashboard/YNDX/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">YNDX</a>) 18.5 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BB.png')"><b>�</b></i>-2<br>12. Северсталь (<a href="http://putinomics.ru/dashboard 
/CHMF/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open 
this link?\\n\\n'+this.href);">CHMF</a>) 18.1<br>13. Русал (<a href="http://putinomics.ru/dashboard/RUAL/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">RUAL</a>) 17.3 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BA.png')"><b>�</b></i>+2<br>14. Та 
тнефть (<a href="http://putinomics.ru/dashboard/TATN/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">TATN</a>) 15.1 <br>15. Транснефть (TRNF) 14.5 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BA.png')"><b>�</b></i>+1<br>16. TCS Group (<a href="htt 
p://putinomics.ru/dashboard/TCSG/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">TCSG</a>) 14.2 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BB.png')"><b>�</b></i>-5<br>17. Алроса (<a href="http://putinomics.ru/dashboard/ALRS/MOEX?utm_source=tg&am 
p;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">ALRS</a>) 11.2<br>18. ММК (<a href="http://putinomics.ru/dashboard/MAGN/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">MAGN</a>) 9.6 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BA.png')"><b>�</b></i>+2<br>19. Фосагро (<a href="http://putinom 
ics.ru/dashboard/PHOR/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">PHOR</a>) 9.0 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BA.png')"><b>�</b></i>+3<br>20. Акрон (<a href="http://putinomics.ru/dashboard/AKRN/MOEX?utm_source=tg&amp;utm_medium= 
social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">AKRN</a>) 8.4 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BA.png')"><b>�</b></i>+9<br>21. ПИК (<a href 
="http://putinomics.ru/dashboard/PIKK/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">PIKK</a>) 8.2 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BB.png')"><b>�</b></i>-3<br>22. En+ (<a href="http://putinomics.ru/dashboard/ENPG/MOEX?utm_source=tg&a 
mp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">ENPG</a>) 8.1 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BA.png')"><b>�</b></i>+6<br>23 
. МТС (<a href="http://putinomics.ru/dashboard/MTSS/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">MTSS</a>) 7.7 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BA.png')"><b>�</b></i>+3<br>24. ВСМПО(<a href="http://putinomics.ru/dashboard/VSMO/MOEX? 
utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">VSMO</a>) 7.4 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BA.png')"><b>�< 
/b></i>+6<br>25. Полиметалл (<a href="http://putinomics.ru/dashboard/POLY/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">POLY</a>) 7.2 <i class="emoji" 
style="background-image:url('//telegram.org/img/emoji/40/F09F94BB.png')"><b>�</b></i>-6<br>26. ВТБ (<a href="http://putinomics.ru 
/dashboard/VTBR/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">VTBR</a>) 7.0 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BB.png')"><b>�</b></i>-5<br>27. Магнит (<a href="http://putinomics.ru/dashboard/MGNT/MOEX?utm_source=tg&amp;utm_medium=socia 
l&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">MGNT</a>) 7.0 
<i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BB.png')"><b>�</b></i>-3<br>28. Евраз (EVR) 6.5 < 
i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BB.png')"><b>�</b></i>-10<br>29. X5 Retail (<a hre 
f="http://putinomics.ru/dashboard/FIVE/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">FIVE</a>) 6.4 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94BB.png')"><b>�</b></i>-3<br>30. Fix Price (<a href="http://putinomics.ru/dashboard/FIXP/MOEX?utm_sour 
ce=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">FIXP</a>) 5.3 <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F8695.png')"><b>�</b></i>< 
br><br>Из топ-30 выпал Arrival с $2.5 млрд капитализации.<br><br>Капитализация компаний по состоянию на 17 ноября 2021 – <a href="https://t.me/AK47pfl/10318" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">здесь</a>.<br><br><a href="?q=%23%D1%86%D0%B8%D1%84%D1%80%D1%8B">#цифры</a><br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,                                                                                                                            
      publishedAt: '2022-02-15 17:28:37'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: 'c7f4b9e3ecaaa1d1b283e9e94d728a55'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Топ-30 российских компаний по капитализации. По состоянию на 15 февраля 2021 (в $ млрд), а также изменение их места в рейтинге с 17 ноября 2021 года.  1. Газпром (GAZP) 103.5 2. Сбер (SBER) 80.2 3. Роснефть (ROSN) 78.9 4. Новатэк (NVTK) 64.3 5. 
Лукойл (LKOH) ',                                                                                                                  
      html: `<div class="tgme_widget_message_text js-message_reply_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F938C.png')"><b>�</b></i> Топ-30 российских компаний по капитализации. По состоянию на 15 февраля  
2021 (в $ млрд), а также изменение их места в рейтинге с 17 ноября 2021 года.  1. Газпром (GAZP) 103.5 2. Сбер (SBER) 80.2 3. Роснефть (ROSN) 78.9 4. Новатэк (NVTK) 64.3 5. Лукойл (LKOH)…</div>`,                                                                 
      publishedAt: '2022-02-15 17:44:09'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: 'e45148a622d0029f2301e692c8c86aae'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Индикатор ЖиС Россия. 16.02.2022.Текущее настроение: Спокойствие.Индикатор ЖиС помогает выбрать лучшие периоды для 
покупки и продажи акций. Например, при экстремальной жадности на рынках (значение индекса выше 80 пунктов) лучше продавать активы, а не покупать их.  Подробнее об индикаторе.#morning #ЖиС@AK47pfl',                                                               
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/E29A96.png')"><b>⚖.                                                                                         
<br><br><b>Индикатор ЖиС помогает выбрать лучшие периоды для покупки и продажи акций.</b> Например, при экстремальной жадности на 
рынках (значение индекса выше 80 пунктов) лучше продавать активы, а не покупать их.<br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F9189.png')"><b>�</b></i> <a href="https://t.me/AK47pfl/5166" target="_blank" rel="noopener" on 
click="return confirm('Open this link?\\n\\n'+this.href);">Подробнее об индикаторе</a>.<br><br><a href="?q=%23morning">#morning</a> <a href="?q=%23%D0%96%D0%B8%D0%A1">#ЖиС</a><br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,              
      publishedAt: '2022-02-16 07:00:00'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '1c605fe2062d0daf6151ffffae8bdc59'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  16.02.2022  Главные темы:  Байден заявил о готовности договариваться по Украине и безопасности в Европе.  Блинкен не исключил «военную агрессию» России против Украины на этой неделе.  CNN: эскалация на Украине грозит США ростом инфляции более чем на 10%.  За чем следить:  Переговоры Путина и президента Бразилии.  Новатэк (NVTK): МСФО за 2021 год.  10:00 Великобритания: ИПЦ в январе.  16:30 США: индекс розничных продаж в январе.  18:30 США: запасы сырой нефти.#morning @AK47pfl',                       
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/E29880.png')"><b>☀a                                                                                         
m.org/img/emoji/40/F09F93B0.png')"><b>�</b></i> <b>Главные</b> <b>темы:</b><br>• Байден <a href="https://vedomosti.ru/politics/ar 
ticles/2022/02/16/909492-baiden-o-gotovnosti-dogovarivatsya" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">заявил</a> о готовности договариваться по Украине и безопасности в Европе.<br>• Блинкен <a href="https://t.me/cbrstocks/31986" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">не исключил</a> «военную агрессию» России против Украины на этой неделе.<br>• CNN: эскалация на Украине <a href="https://t.me/cbrstocks/31987" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">грозит</a> США ростом инфляции более чем на 10%.<br><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F9181.png')"><b>�</b></i> <b>За чем сле 
дить:</b><br>• Переговоры Путина и президента Бразилии.<br>• Новатэк (<a href="http://putinomics.ru/dashboard/NVTK/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">NVTK</a>): МСФО за 2021 год.<br>• 10:00 Великобритания: ИПЦ в январе.<br>• 16:30 США: индекс розничных продаж в январе.<br>• 18:30 США: запасы сырой нефти.<br><br><a href="?q=%23morning">#morning</a> <br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,                                                                                                             
      publishedAt: '2022-02-16 08:30:40'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: 'f9a441c8d486a88e28c111a2693eae86'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  В росте криптовалют можно участвовать через акции.Связь (корреляция)  itcoin  и индекса NASDAQ достигла максимума.Сторонниками криптовалют Биткойн отстаивается как актив, не связанный с традиционными финансовыми рынками, однако связь с ними продолжает расти: корреляция Биткойна и индекса NASDAQ достигла уже 0.53.Коэффициент корреляции 1 означает, что активы движутся в одном направлении, -1   в противоположных направлениях.@AK47pfl',                                                                     
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94A5.png')"><b>�</b></i> <b>В росте криптовалют можно участвовать через акции.</b><br><b>Связь (корреля 
ция) ₿itcoin  и индекса NASDAQ</b> <b>достигла максимума.</b><br><br>Сторонниками криптовалют Биткойн отстаивается как актив, не связанный с традиционными финансовыми рынками, однако связь с ними продолжает расти: корреляция Биткойна и индекса NASDAQ достигла 
уже 0.53.<br><br><i>Коэффициент корреляции 1 означает, что активы движутся в одном направлении, </i>-<i>1 </i>— <i>в противоположных направлениях.</i><br><br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,                                   
      publishedAt: '2022-02-16 09:43:04'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: 'd251421289e00b395bcddd7cb9f45aee'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Геополитический апдейт: пока ситуация развивается по дипломатическому пути.  Последние события:  Байден: говорил с 
Путиным, чтобы дать понять, что мы готовы продолжать дипломатию на высоком уровне.  Минобороны РФ: военные возвращаются после учений в Крыму.  Песков про «вторжение РФ»: лучше завести будильники и самим убедиться [в его отсутствии].  Макрон про ЛДНР: мы остаемся бдительными и просим [Путина] не выполнять просьбу Думы. Ожидается сегодня:  Переговоры Путина и президента Бразилии.@AK47pfl',      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F8C8F.png')"><b>�</b></i> <b>Геополитический апдейт:</b> <b>пока ситуация развивается по дипломатическом 
у пути.</b><br><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09FA58A.png')"><b>�</b></i><b> Посл 
едние события:</b><br>• <a href="https://www.youtube.com/watch?v=lW4fuHit9HI" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Байден</a>: говорил с Путиным, чтобы дать понять, что мы готовы продолжать дипломатию на высоком уровне.<br>• <a href="https://ria.ru/20220216/ucheniya-1773047613.html" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Минобороны РФ</a>: военные возвращаются после учений в Крыму.<br>• <a href="https://ria.ru/20220216/vtorzhenie-1773024868.html" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Песков про «вторжение РФ»</a>: лучше завести будильники и самим убедиться [в его отсутствии].<br>• <a href="https://edition.cnn.com/europe/live-news/ukraine-russia-news-02-15-22-intl/index.html" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">Макрон про ЛДНР</a>: мы остаемся бдительными и просим [Путина] не выполнять просьбу Думы.<br><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/E29D97.png')"><b>❗b                                         
r>• Переговоры Путина и президента Бразилии.<br><br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,           
      publishedAt: '2022-02-16 10:36:22'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: 'fcf40e4df055d5a396ade4c9862a48a5'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '#Политика  Все российские военные покинут Белоруссию после учений   МИД Белоруссии',                                 
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><a href="?q=%23%D0%9F%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0">#Политика</a><br><b><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F87A7F09F87BE.png')"><b>��</b></i><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F87B7F0  9F87BA.png')"><b>��</b></i>   
Все российские военные покинут Белоруссию после учений</b> — МИД Белоруссии</div>`,                                               
      publishedAt: '2022-02-16 10:52:54'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '90f70abaf3aa4f6bd73e17228cfaa8b4'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Пузыри сдуваются одинаково. Nasdaq 100 в 1998-2001 годах (верхний график) и ARK Innovation ETF в 2019-2022 годах (нижний график).@AK47pfl',                                                                                                          
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F94A5.png')"><b>�</b></i><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F8 
E88.png')"><b>�</b></i><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F938C.png')"><b>�</b></i> <b  
>Пузыри сдуваются одинаково.</b> Nasdaq 100 в 1998-2001 годах (верхний график) и ARK Innovation ETF в 2019-2022 годах (нижний график).<br><br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,                                                   
      publishedAt: '2022-02-16 11:34:48'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '2f2ac8c8ce8a769d61aff7560edc8546'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Русские физики героически выкупают продажи иностранцев уже с октября.Согласно докладу ЦБ РФ в январе нерезиденты (западные фонды) продали российские бумаги на 111.1 млрд руб.Основной объем покупок осуществили физические лица на сумму 98.1 млрд  
руб. и российские фонды (в основном деньги тех же физиков)   ещё на 44.9 млрд рублей.Сколько ещё денег готовы вложить россияне?.. 
 Хватит ли этих средств, чтобы дождаться возвращения иностранцев?..@AK47pfl',                                                     
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F92AA.png')"><b>�</b></i> <b>Русские физики героически выкупают продажи иностранцев</b> <b>уже с октября 
.</b><br><br>Согласно <a href="https://cbr.ru/Collection/Collection/File/39795/ORFR_2022-01.pdf" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">докладу ЦБ РФ</a> в январе нерезиденты (западные фонды) продали российские бумаги на 111.1 млрд руб.<br><br>Основной объем покупок осуществили физические лица на сумму 98.1 млрд руб. и российские фонд 
ы (в основном деньги тех же физиков) – ещё на 44.9 млрд рублей.<br><br><i>Сколько ещё денег готовы вложить россияне?.. <br>Хватит 
 ли этих средств, чтобы дождаться возвращения иностранцев?..</i><br><br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,                                                                                                                         
      publishedAt: '2022-02-16 14:15:14'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: 'd74f02d9078d0ea2091544c710b0ca57'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: 'РДВ   это совершенно новое явление в мире инвестиций. Впервые в истории каждый желающий, читая канал, может стать управляющим собственного первоклассного инвестиционного фонда.  Премиум доступ к знаниям РДВ: @RDVPREMIUMbot  Партнёрский сайт для думающих инвесторов: putinomics.ru  РынкиДеньгиВласть: t.me/AK47pfl  Чат РДВ: http://t.me/AK47pflchat',                             
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><b>РДВ — это совершенно новое явление в мире инвестиций. </b>Впервые в истории каждый желающий, читая канал, может стать управляющим собственного первоклассного инвестиционного фонда.<br><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F93A3.png')"><b>�</b></i> <b>Премиум доступ 
 к знаниям РДВ:</b> <a href="https://t.me/RDVPREMIUMbot" target="_blank">@RDVPREMIUMbot</a><br><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09FA7A0.png')"><b>�</b></i> <b>Партнёрский сайт для думающих инвесторов:</b> <a href= 
"http://putinomics.ru/" target="_blank" rel="noopener">putinomics.ru</a><br><br><b><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F8F86.png')"><b>�</b></i> РынкиДеньгиВласть:</b> <a href="http://t.me/AK47pfl" target="_blank" rel= 
"noopener">t.me/AK47pfl</a><br><br><b><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F97A3.png')"><b>�</b></i> Чат РДВ: </b><a href="http://t.me/AK47pflchat" target="_blank" rel="noopener">http://t.m e/AK47pflchat</a></div>`,     
      publishedAt: '2022-02-16 16:02:23'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '098aea57d88be269520d0cba33625cd6'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Бегство иностранных инвесторов: как долго могут продолжаться продажи западных фондов.Ранее: русские физики выкупают продажи иностранцев.На примере Китая видно, что продажи нерезидентов (западных фондов) могут оказывать давление на рынок целый год. Влияние США (в случае Китая - угроза делистинга и торговой войны, в случае России - угроза санкций) усиливает или даже вызывает падение национальных фондовых рынков.На графике   динамика акций крупнейших компаний Китая с листингом в США в 2021 году.@AK47pfl',                                                                                                                                
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F8F83F09F8FBDE2808DE29982.png')"><b>��р                                                                  
одолжаться продажи западных фондов.</b><br>Ранее: <a href="https://t.me/AK47pfl/11145" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">русские физики выкупают продажи иностранцев.</a><br><br>На примере Китая видно, что продажи нерезидентов (западных фондов) могут оказывать давление на рынок целый год. <br><br>Влияние США (в случае Китая - угроза делистинга и торговой войны, в случае России - угроза санкций) усиливает или даже вызывает падение национальных фондовых рынков.<br><br><i>На графике — динамика акций крупнейших компаний Китая с <a href="https://www.uscc.gov/sites/default/files/2021-05/Chinese_Companies_on_US_Stock_Exchanges_5-2021.pdf" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">листингом</a> в США</i> <i>в 2021 году.</i><br><br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,   
      publishedAt: '2022-02-16 16:25:54'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: 'f91224eeb48130078018f0c2e6ec97e8'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Как выросли российские акции в $ с пика санкционной паники 24 января? Индекс РТС прибавил +18%.Топ-10 выросших акций:  Распадская (RASP) +43%  Озон (OZON) +39%  HeadHunter (HHRU) +35%  Русал (RUAL) +33%  Яндекс (YNDX) +33%  ТКС (TCSG) +26%  НЛМК (NLMK) +24%  Северсталь (CHMF) +24%  FixPrice (FIXP) +24%  Сбербанк (SBER) +24%10 акций показавших наименьшую доходность:  Сургут преф (SNGSP) +9%  ВТБ (VTBR) +9%  Белуга (BELU) +7%  Ростелеком (RTKM) +7%  ИнтерРАО (IRAO) +7%  ФСК (FEES) +5%  СовКомФлот (FLOT) +4%  Полиметалл (POLY) +3%  МосБиржа (MOEX) +3%  ПИК (PIKK) -4%#цифры @AK47pfl',                                                
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F938C.png')"><b>�</b></i> <b>Как выросли российские акции в $ с пика санкционной паники 24 января?</b> И 
ндекс РТС прибавил +18%.<br><br><b>Топ-10 выросших акций:</b><br>• Распадская (<a href="https://putinomics.ru/dashboard/RASP/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">RASP</a>) +43%<br>• Озон (<a href="https://putinomics.ru/dashboard/OZON/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">OZON</a>) +39%<br>• HeadHunter (<a href="https://putinomics.ru/dashboard/HHRU/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">HHRU</a>) +35%<br>• Русал (<a href="https://putinomics.ru/dashboard/RUAL/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">RUAL</a>) +33%<br>• Яндекс (<a href="https://putinomics.ru/dashboard/YNDX/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">YNDX</a>) +33%<br>• ТКС (<a href="https://putinomics.ru/dashboard/TCSG/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">TCSG</a>) +26%<br>• НЛМК (<a href="https://putinomics.ru/dashboard/NLMK/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">NLMK</a>) +24%<br>• Северсталь (<a href="https://putinomics.ru/dashboard/CHMF/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">CHMF</a>) +24%<br>• FixPrice (<a href="https://putinomics.ru/dashboard/FIXP/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">FIXP</a>) +24%<br>• Сбербанк (<a href="https://putinomics.ru/dashboard/SBER/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">SBER</a>) +24%<br><br><b>10 акций показавших 
наименьшую доходность:</b><br>• Сургут преф (<a href="https://putinomics.ru/dashboard/SNGSP/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">SNGSP</a>) +9%<br>• ВТБ (<a href="https://putinomics.ru/dashboard/VTBR/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">VTBR</a>) +9%<br>• Белуга (<a href="https://putinomics.ru/dashboard/BELU/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">BELU</a>) +7%<br>• Ростелеком (<a href="https://putinomics.ru/dashboard/RTKM/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">RTKM</a>) +7%<br>• ИнтерРАО (<a href="https://putinomics.ru/dashboard/IRAO/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">IRAO</a>) +7%<br>• ФСК (<a href="https://putinomics.ru/dashboard/FEES/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">FEES</a>) +5%<br>• СовКомФлот (<a href="https://putinomics.ru/dashboard/FLOT/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">FLOT</a>) +4%<br>• Полиметалл (<a href="https://putinomics.ru/dashboard/POLY/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">POLY</a>) +3%<br>• МосБиржа (<a href="https://putinomics.ru/dashboard/MOEX/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">MOEX</a>) +3%<br>• ПИК (<a href="https://putinomics.ru/dashboard/PIKK/MOEX" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">PIKK</a>) -4%<br><br><a href="?q=%23%D1%86%D0%B8%D1%84%D1%80%D1%8B">#цифры</a> <br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,                                                               
      publishedAt: '2022-02-16 17:10:07'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '5db86dad434c5f12af908c78e9f12c1d'                                                                                       
  },                                                                                                                              
  {                                                                                                                               
    metadata: {                                                                                                                   
      text: '  Главное по секторам российского рынка  Нефтяной сектор: Hold. Цены на нефть продолжают держаться выше $90 за баррель. Большое влияние на цены оказывает напряженность на границе России и Украины. Параллельно с этим рынок продолжает внимательно следить за развитием ядерной сделки с Ираном, которая, по последним новостям, движется к позитивному окончанию.  Здравоохранение: Buy. Медицина   один из лучших секторов, чтобы сберечь деньги от высокой инфляции (РФ, США). Кроме того, в медицине все еще большие 
возможности для роста:  Мать и дитя (MDMG) растет темпами 30% в год и будет наиболее устойчивой к инфляции компанией в РФ, считает источник РДВ.  Банковский сектор: Hold. ЦБ РФ в пятницу снова повысил ключевую ставку и повысил прогноз по ставке в 2022 году. На этом фоне, акции банков, покупающихся в ожидании высоких дивидендов, теряют привлекательность. Но, также, на этой неделе ослабло 
политическое давление, благодаря началу отвода войск РФ.#Сектор #ROSN #LKOH #TATN #SIBN #SNGS #ISKJ #AFKS #MDMG #SBER #SBERP #VTBR #TSCG @AK47pfl',                                                                                                                 
      html: `<div class="tgme_widget_message_text js-message_text" dir="auto"><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/E29C85.png')"><b>✅</b></i><b> Главное по секторам российского рынка<br><br><i class="emoji" style="backgroun
d-image:url('//telegram.org/img/emoji/40/F09F9BA2.png')"><b>�</b></i> Нефтяной сектор: Hold.</b> Це ны на нефть продолжают держаться выше $90 за баррель. Большое влияние на цены оказывает напряженность на границе России и Украины. Параллельно с этим рынок продолжает внимательно следить за развитием ядерной сделки с Ираном, которая, по последним новостям, движется к позитивному окончанию.<br><br><b><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F8FA5.png')"><b>�</b></i> Здравоохранение 
</b>: <b>Buy</b>. Медицина — один из <a href="https://t.me/AK47pfl/10092" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">лучших</a> секторов, чтобы сберечь деньги от высокой инфляции (<a href="https://t.me/AK47pfl/11099" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">РФ</a>, <a href="https://t.me/AK47pfl/11074" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">США</a>). Кроме того, в медицине все еще большие возможности для роста:  Мать и дитя (<a href="https://putinomics.ru/dashboard/MDMG/MOEX?utm_source=tg&amp;utm_medium=social&amp;utm_campaign=rdv" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">MDMG</a>) <a href="https://t.me/AK47pfl/11022" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">растет</a> темпами 30% в год и будет наиболее устойчивой к инфляции компанией в РФ, считает источник РДВ.<br><br><i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F8FA6.png')"><b>�</b></i><b> Банковский сектор: Hold</b>.  
ЦБ РФ в пятницу снова <a href="https://t.me/cbrstocks/31753" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">повысил</a> ключевую ставку и <a href="https://t.me/cbrstocks/31758" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">повысил</a> прогноз по ставке в 2022 году. На этом фоне, акции банков, покупающихся в ожидании высоких дивидендов, теряют привлекательность. Но, также, на этой неделе ослабло политическое давление, благодаря <a href="https://t.me/cbrstocks/31917" target="_blank" rel="noopener" onclick="return confirm('Open this link?\\n\\n'+this.href);">началу отвода войск РФ</a>.<br><br><a href="?q=%23%D0%A1%D0%B5%D0%BA%D1%82%D0%BE%D1%80">#Сектор</a> <a href="?q=%23ROSN">#ROSN</a> <a href="?q=%23LKOH">#LKOH</a> <a href="?q=%23TATN">#TATN</a> <a href="?q=%23SIBN">#SIBN</a> <a href="?q=%23SNGS">#SNGS</a> <a href="?q=%23ISKJ">#ISKJ</a> <a href="?q=%23AFKS">#AFKS</a> <a href="?q=%23MDMG">#MDMG</a> <a href="?q=%23SBER">#SBER</a> <a href="?q=%23SBERP">#SBERP</a> <a href="?q=%23VTBR">#VTBR</a> <a href="?q=%23TSCG">#TSCG</a> <br><a href="https://t.me/AK47pfl" target="_blank">@AK47pfl</a></div>`,                                                                                                      
      publishedAt: '2022-02-16 18:00:19'                                                                                          
    },                                                                                                                            
    type: 'telegram',                                                                                                             
    channel: 'AK47pfl',                                                                                                           
    url: 'https://t.me/s/AK47pfl',                                                                                                
    createdAt: '2022-02-16 21:14:19',                                                                                             
    md5: '68932664eda615fc8c985ea4c06b6ff2'                                                                                       
  }                                                                                                                               
]                                                                                                                                 
---------------------------------------------------------------   

```

Для виконання з зовнішніми налаштуваннями треба окремо виносити ці налаштування та використовувати:

```sh
npm run debug ./src/scanany/telegram1.yml ./test/params/tg1.params.yml 

```

параметри з файлу ```./test/params/tg1.params.yml``` будуть передані в скрипт ./src/scanany/telegram1.yml.

В консольному виводі з'явиться додаткова секція ```Call with params```:

```sh
---------------------------------------------------------------                                                                   
Debug scanany script: D:\MOLFAR\scanany-scripts\src\scanany\telegram1.yml                                                         
                                                                                                                                  
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