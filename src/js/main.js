/**
 * Created by dmitrijmihajlov on 26.08.16.
 */
"use strict"

var factory = (function ($) {
    var weightDrag,// ссылка на перемещаемый груз
        weightList = [], // лист всех грузов
        acceleration = 0.005, // ускорение свободного падения грузов
        sizes = [100, 200, 50, 500, 375, 125], // возможные варианты массы груза
        isMobile = typeof document.ontouchstart == 'undefined' ? false : true;// определяем наличие touch интерфейса

    // добавляем новую анимацию для jQuery
    $.extend($.easing, {
        physics: function (c) {
            return c + (c * acceleration);
        }
    });
    // ================ инициализация ================
    function init() {
        var resizeTimer
        $().ready(function () {
            factory.weight_factory = new weight_factory; // объект управления пушкой
            factory.weigher = new weigher; // объект весов
            $(window).on('resize',function(){
                clearInterval(resizeTimer);
                resizeTimer = setTimeout(function(){
                    weightList.forEach(function(weight){
                        if(!weight.$scalepan){
                            weight.calc_physics()
                        }
                    })
                },100)
            })
            if (!isMobile) {
                // следим за перетаскиванием груза "weightDrag", нужен только для этого
                // глобальная слежка за курсором нужна, так как локальный weight.$el.on('mousemove'... работает не так как нужно
                $(document).on('mousemove', function (e) {
                    if (weightDrag) {
                        weightDrag.state = 'question';
                        weightDrag.$el.css({
                            left: e.clientX,
                            top: e.clientY
                        });
                    }
                })
                // mouseup глобален так, как при перемещении груза можно навести на другой элемент и событие не сработает
                $(document).on('mouseup', function (e) {
                    if (weightDrag) {
                        weightDrag.state = 'default';
                        weightDrag.drag = false; // запускает анимацию падения
                        weightDrag = null;
                    }
                })
            }
        })
    };
    // ================ /инициализация ================

    // ================ Пушка ================
    function weight_factory() {
        var self = this,
            move = 0;// необходим, для предотвращения выстрела пушки после перемещения груза
        this.$el = $('#weight_factory');
        if (isMobile) {
            // !!перемешение пушки (touchmove) определяеться непосредвенно по ней!!
            this.$el.get(0).addEventListener('touchmove', function (e) {
                self.$el.css({
                    left: e.touches[0].clientX - self.$el.width() / 2
                })
                e.stopPropagation();
                e.preventDefault();
            }, false);
            this.$el.get(0).addEventListener('touchend', function (e) {
                e.stopPropagation();
                e.preventDefault();
            });
            document.addEventListener('touchend', function (e) {
                if (self.reload === false) {
                    factory.weight(sizes[Math.floor(Math.random() * sizes.length)]);
                    self.reload = true;
                }
                e.preventDefault();
                e.stopPropagation();
            }, false);
        }
        else {
            // определяем события перемещения пушки
            $(document).on('mousemove', function (e) {
                move = e.clientX;
                self.$el.css({
                    left: e.clientX - self.$el.width() / 2
                })
            });
            // груз может создаваться по нажатию пробела и лкм
            var createWaiger = function (e) {
                factory.weight(sizes[Math.floor(Math.random() * sizes.length)]);
                self.reload = true;
            };

            $(document).on('mousedown', function () {
                move = 0;
            });

            $(document).on('mouseup', function (e) {
                if (self.reload === false && move == 0 && e.originalEvent.button == 0 && weightDrag == null) {
                    createWaiger();
                }
                else {
                    move = 0;
                }
            });

            $(document).on('keyup', function (e) {
                if (e.keyCode === 32 && self.reload === false) {
                    createWaiger();
                    e.preventDefault();
                }
            });
        }
    }

    // Биндим свойство объекта на reload, определяет перезарядку пушки
    // Необходимо из-за специфики расчета анимации падения грузка
    Object.defineProperty(weight_factory.prototype, 'reload', {
        get: function () {
            return this.$el.hasClass('reload');
        },
        set: function (value) {
            this.$el.toggleClass('reload', !!value);
        }
    })
    // ================ /Пушка ================

    // ================ Груз ================
    function weight(size) {
        var self = this;
        this.weight = size;
        this.$el = $('<div class="weight"></div>');
        this.state = 'default';
        if (isMobile) {
            // работа с перемещением грузка юзером
            // weightDrag используется для сохранения аналогии при работе с курсором, а по факту достаточно self
            this.$el.get(0).addEventListener('touchstart', function (e) {
                if (e.targetTouches.length == 1) {
                    self.drag = true;
                    weightDrag = self;
                    if (self.$scalepan) {
                        self.$scalepan.trigger('collision.pop', [self]);
                    }
                }
                e.preventDefault();
                e.stopPropagation();
            }, false);
            this.$el.get(0).addEventListener('touchmove', function (e) {
                if (weightDrag) {
                    weightDrag.state = 'question';
                    weightDrag.$el.css({
                        left: e.touches[0].clientX,
                        top: e.touches[0].clientY
                    })
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, false);
            this.$el.get(0).addEventListener('touchend', function (e) {
                if (weightDrag) {
                    weightDrag.state = 'default';
                    weightDrag.drag = false; // запускает анимацию падения
                    weightDrag = null;
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, false);
        }
        else {
            // работа с перемещением грузка юзером
            this.$el.on('mousedown', function (e) {
                if(e.originalEvent.button == 0){
                    self.drag = true;
                    weightDrag = self;
                    if (self.$scalepan) {
                        self.$scalepan.trigger('collision.pop', [self]);
                    }
                }
            });
        }
        // устанавливаем позицию груза относительно пушки
        this.$el.css({
            left: factory.weight_factory.$el.offset().left - 15 + factory.weight_factory.$el.width() / 2
        });
        // добавляем объект на сцену, кроме этого может находиться внутри чаш весов (weigher_scalepan)
        this.$el.appendTo($('#weigher_main'));
        weightList.push(this);
        // расчет падения груза
        this.calc_physics();
    }

    Object.defineProperties(weight.prototype, {
        // состояние объекта
        // default - в падении
        // happy - на чаше с большим суммарным весом
        // angry - на чаще с меньшим суммарным весом
        // question - перетаскивание
        // lost - в любом другом месте, после падения
        state: {
            get: function () {
                return this.$el.attr('data-state');
            },
            set: function (value) {
                this.$el.attr('data-state', value);
            }
        },
        // определяем объект столкновения с грузом если не чаши весов то #weigher_main
        get_collision: {
            get: function () {
                var offset = this.$el.offset(),
                    offset_width = this.$el.width(),
                    collision_offset_top = -1,
                    collision = [];
                $('#weigher_scalepan_left, #weigher_scalepan_right').each(function (i, item) {
                    var item_offset = $(this).offset(),
                        item_width = $(this).width();

                    if (offset.top <= item_offset.top &&
                        (offset.left + offset_width / 2 >= item_offset.left && offset.left <= item_offset.left + item_width) &&
                        (collision_offset_top < item_offset.top || typeof collision == 'undefined')) {
                        //if body
                        collision = $(item);
                    }
                });
                return collision;
            }
        },
        // расчет падения груза
        calc_physics: {
            value: function () {
                var fx,
                    top,
                    self = this,
                    offset = this.$el.offset(),
                    collision = this.get_collision;

                if (collision.length) {
                    top = collision.offset().top + collision.height() - this.$el.height();
                    /* если collision - чаша весов, то после окончания анимации добавляем груз
                       к объекту weigher.scalepan_( left|right )_ar */

                    fx = function () {
                        collision.trigger('collision.push', [self]);
                        // reload пушки в этом случае определяется анимацией весов
                    }
                }
                else {
                    top = $('#weigher_main').height() - this.$el.height();
                    // если collision не определен то бросаем в #weigher_main и меняем картинку груза
                    fx = function () {
                        self.state = 'angry';
                        // анимации #weigher_main нет, сразу перезаряжаем пушку
                        factory.weight_factory.reload = false;
                    };
                }
                // останавливаем анимацию весов
                factory.weigher.$scalepan_left.stop();
                factory.weigher.$scalepan_right.stop();
                /* падение пушки с учетом ускорения, необходимо чтобы, на весы и #weigher_main
                   груз падал с одинаковой скоростью */
                this.$el.animate({top: top}, {
                    duration: Math.sqrt((top - offset.top) / acceleration),
                    easing: "physics",
                    complete: fx
                });
            }
        },
        // определяем .class при перемещения грузка юзером, запускает анимацию падения
        drag: {
            set: function (value) {
                this.$el.toggleClass('drag', !!value);
                if (!!value == false) {
                    this.calc_physics();
                }
            },
            get: function () {
                return this.$el.hasClass('drag');
            }
        }
    })
    // ================ /Груз ================

    // ================ Весы ================
    function weigher() {
        var self = this;
        this.scalepan_left_ar = []; // грузы левой чаши
        this.scalepan_right_ar = []; // грузы правой чаши
        this.$el = $('#weigher');
        this.$scalepan_left = $('#weigher_scalepan_left');
        this.$scalepan_right = $('#weigher_scalepan_right');
        // расчет конечного веса на обеих чашах
        this.set_scalepan_size = function () {
            var left_size = 0, // вес левой чаши
                right_size = 0; // вес правой чаши

            function reduct_size(a, b) {
                return a + b.weight;
            }

            if (self.scalepan_right_ar.length)
                right_size = self.scalepan_right_ar.reduce(reduct_size, 0);
            if (self.scalepan_left_ar.length)
                left_size = self.scalepan_left_ar.reduce(reduct_size, 0);
            /* scalepan_size привязан #weigher[data-size]
               нужно чтобы показывать вес через css:content */
            this.scalepan_size = right_size - left_size;
        };
        // Вешаем обработчики на добавление и удаление груза из чаш
        $.each(['scalepan_left', 'scalepan_right'], function (key, prop) {
            self['$' + prop].on('collision.push', function (e, weight) {
                self[prop + '_ar'].push(weight);
                weight.$scalepan = $(this);
                self.set_scalepan_size();
                weight.$el.css({
                    top: weight.$el.offset().top - weight.$scalepan.offset().top,
                    left: weight.$el.offset().left - weight.$scalepan.offset().left
                })
                weight.$el.appendTo(weight.$scalepan);
            });
            self['$' + prop].on('collision.pop', function (e, weight) {
                var index = self[prop + '_ar'].indexOf(weight);
                if (index != -1) {
                    weight.$scalepan = null;
                    self[prop + '_ar'].splice(index, 1);
                    self.set_scalepan_size();
                    weight.$el.appendTo($('#weigher_main'));
                    weight.$el.css({
                        top: weight.$el.offset().top,
                        left: weight.$el.offset().left
                    })
                }
            });
        });
    }

    Object.defineProperties(weigher.prototype, {
        // pos определяет в сss с какой стороны весов груз тяжелее
        pos: {
            get: function () {
                return this.$el.attr('data-pos');
            },
            set: function (value) {
                this.$el.attr('data-pos', value);
            }
        },
        // расче веса и анимация весов
        scalepan_size: {
            get: function () {
                return parseInt(this.$el.attr('data-size'));
            },
            set: function (value) {
                var self = this,
                    max_weight = 1000,// определяем максимальный, доступный вес. В реальном проекте был бы в конфигах
                    max_height = $('#weigher').height() / 2, // максимальное смешение чаш
                    weight_coff,// кофф. веса к смешению чаш
                    coff; // смешение чаши по весу

                weight_coff = max_height / max_weight;
                coff = weight_coff * value;
                if (value < 0) {
                    // устанавливаем состояние всех грузов на чашах
                    this.scalepan_left_ar.forEach(function (weight) {
                        weight.state = 'happy';
                    });
                    this.scalepan_right_ar.forEach(function (weight) {
                        weight.state = 'lost';
                    });
                    if (this.scalepan_right_ar.length == 0) {
                        coff = -weight_coff * max_weight;
                    };
                }
                // если вес на чашах одинаковый
                else if (value == 0) {
                    // устанавливаем состояние всех грузов на чашах
                    this.scalepan_left_ar.forEach(function (weight) {
                        weight.state = 'default';
                    });
                    this.scalepan_right_ar.forEach(function (weight) {
                        weight.state = 'default';
                    });
                }
                else {
                    // устанавливаем состояние всех грузов на чашах
                    this.scalepan_left_ar.forEach(function (weight) {
                        weight.state = 'lost';
                    });
                    this.scalepan_right_ar.forEach(function (weight) {
                        weight.state = 'happy';
                    });
                    if (this.scalepan_left_ar.length == 0) {
                        coff = weight_coff * max_weight;
                    }
                }
                /* Если фактический вес превышает max_weight то устанавливаем его как максимум,
                   чтобы весы в небо не улетали */
                if (Math.abs(coff) > weight_coff * max_weight) {
                    coff = weight_coff * max_weight;
                    if (value < 0) {
                        coff = -coff;
                    }
                }
                this.pos = value < 0 ? 'left' : 'right';
                //Анимируем весы и устанавливаем reload пушки
                this.$scalepan_left.stop().animate({'top': -coff}, 500, function () {
                    factory.weight_factory.reload = false;
                });
                this.$scalepan_right.stop().animate({'top': coff}, 500);
                self.$el.attr('data-size', value);
            }
        }
    })
    // ================ /Весы ================
    return {
        init: init,
        weight: function (size) {
            return new weight(size);
        },
    }
/* jQuery объект глобальный, а нам понадобилось добавить свою анимацию. Чтобы не было конфликтов используем noConflict.
   По этой же причине $().ready находиться в factory.init */
})(jQuery.noConflict(true));

factory.init();