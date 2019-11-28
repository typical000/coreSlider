/*
 * CoreSlider v1.2.2
 * Copyright 2016 Pavel Davydov
 *
 * Licensed under MIT (http://opensource.org/licenses/MIT)
 */

(function(factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports !== 'undefined') {
    module.exports = factory(require('jquery'));
  } else {
    factory(jQuery);
  }

}(function($) {

  'use strict';

  var CoreSlider = window.CoreSlider || {};

  CoreSlider = function(container, options) {

    var defaults = {
      interval: 5000,                                         // Interval of time between slide changes
      loop: true,                                             // When slider finish, should it loop again from first slide?
      slideshow: true,                                        // Enable/Disable automatic slideshow
      resize: true,                                           // Should be slider responsive on screen resize
      pauseOnHover: true,                                     // Pause the slideshow when hovering over slider
      startOnHover: false,                                    // Start the slideshow when hovering over slider
      sliderSelector: '.core-slider_list',                    // List selector (all items are inside this container)
      viewportSelector: '.core-slider_viewport',              // Viewport selector
      itemSelector: '.core-slider_item',                      // Slider items selector
      navEnabled: true,                                       // Enable/Disable navigation arrows
      navSelector: '.core-slider_nav',                        // Selector for navigation arrows container
      navItemNextSelector: '.core-slider_arrow__right',       // 'Next' arrow selector
      navItemPrevSelector: '.core-slider_arrow__left',        // 'Prev' arrow selector
      controlNavEnabled: false,                               // Enable/Disable control navigation (dots)
      controlNavSelector: '.core-slider_control-nav',         // Control navigation container selector (inside will be created dots items)
      controlNavItemSelector: 'core-slider_control-nav-item', // Single control nav dot (created dynamically. Write without dot. If you need more that one class - add them with space separator)
      loadedClass: 'is-loaded',                               // Classname, that will be added when slider is fully loaded
      clonedClass: 'is-cloned',                               // Classname, that will be added to cloned slides (see option 'clone')
      hiddenClass: 'is-hidden',                               // Classname, indicates hidden things
      disabledClass: 'is-disabled',                           // Classname, that will be added it item is disabled (in most of cases - item will be display: noned)
      activeClass: 'is-active',                               // Classname, that will be added to active items (for example control navs, etc.)
      reloadGif: false,                                       // Reload gif's on slide change for replaying cycled animation inside current slide
      clone: false,                                           // Indicates, that at begin and at end of slider carousel items will be cloned to create 'infitite' carousel illusion
      items: 1,                                               // How mutch items will be placed inside viewport. Leave 1 if this is slider, 2 ot more - it will look like a carousel
      itemsPerSlide: 1,                                       // How many items must be slided by one action (NOTE: Must be less than 'items' option)
      cloneItems: 0,                                          // How mutch items will be cloned at begin and at end of slider

      // Callbacks API
      before: function() {}, // Callback function - fires before each slider animation
      after: function() {},  // Callback function - fires after each slider animation
      init: function() {},   // Callback function - fires after slider was initialized
    };

    // Extend defaults with settings passed on init
    this.settings = $.extend({}, defaults, options);

    var self = this,
        animateInterval,
        $sliderContainer = $(container),
        $sliderViewport = $sliderContainer.find(self.settings.viewportSelector),
        $slider = $sliderContainer.find(self.settings.sliderSelector),
        $sliderItems = $sliderContainer.find(self.settings.itemSelector),
        $clonedSliderItems = null,
        $sliderNav = $sliderContainer.find(self.settings.navSelector),
        $sliderPrevBtn = $sliderContainer.find(self.settings.navItemPrevSelector),
        $sliderNextBtn = $sliderContainer.find(self.settings.navItemNextSelector),
        $sliderNavBtns = $sliderPrevBtn.add($sliderNextBtn),
        $sliderControlNav = $sliderContainer.find(self.settings.controlNavSelector),
        $sliderControlNavItems,
        slideCount = $sliderItems.length - 1, // Count, with counter, starting from zero
        slideCountTotal = $sliderItems.length,
        slideWidth, // Single slide width
        currentSlide = 0,
        transformPrefix = getVendorPrefixes(["transform", "msTransform", "MozTransform", "WebkitTransform"]),
        transitionPrefix = getVendorPrefixes(["transition", "msTransition", "MozTransition", "WebkitTransition"]),
        resizeTimeout,
        isFirstLoad = true, // Indicates, that slider was first loaded
        isAnimating = false, // Mark active slide animation
        cssTransform = {};

    // Store reference to the slider object
    $.data(container, 'coreslider', this);

    // Getter for vendor prefixes
    function getVendorPrefixes(prefixes) {
      var tmp = document.createElement("div"),
          result = ""; // Store results here
      for (var i = 0; i < prefixes.length; i++) {
        if (typeof tmp.style[prefixes[i]] != 'undefined') {
          result = prefixes[i];
          break;
        } else {
          result = null;
        }
      }
      return result;
    }

    function getTranslateX(offset) {
      return 'translateX(' + offset + 'px)';
    }

    // Function for setting sizes for each item in slider
    function setSizes() {
      slideWidth = $sliderViewport.width() / self.settings.items;
      $sliderItems.add($clonedSliderItems).css('width', slideWidth);
      $slider.css('width', slideWidth * (slideCount + self.settings.cloneItems*2 +  1));
    }

    // Initialization of slider
    this.init = function() {
      // Set inner container sizes
      $sliderContainer.addClass(self.settings.loadedClass);
      if (self.settings.clone) {
        // If clone is enabled - clone slides on end and on begin of slider
        // Prepend first last items at begin of slider and first elements on end of slider
        $slider.append($sliderItems.slice(0, self.settings.cloneItems).clone().addClass(self.settings.clonedClass));
        $slider.prepend($sliderItems.slice(slideCount - self.settings.cloneItems + 1, slideCount + 1).clone().addClass(self.settings.clonedClass));
        // Cache cloned items in variable
        $clonedSliderItems = $sliderContainer.find(self.settings.itemSelector).filter('.' + self.settings.clonedClass);
      }

      setSizes();

      self.setSlide(currentSlide, true, false);
      if (self.settings.slideshow) {
        self.play();
      }
      if (self.settings.resize) {
        self.resize();
      }
      // Pause on hover events
      if (self.settings.pauseOnHover && self.settings.slideshow) {
        $sliderContainer.mouseenter(function() {
          self.stop();
        });
        $sliderContainer.mouseleave(function() {
          self.play();
        });
      }
      // Start on hover events
      if (self.settings.startOnHover && self.settings.slideshow) {
        $sliderContainer.mouseenter(function() {
          self.play();
        });
        $sliderContainer.mouseleave(function() {
          self.stop();
        });
      }

      // Add handlers for slider navs (prev/next)
      if (self.settings.navEnabled) {
        $sliderPrevBtn.on('click', function() {
          if (isAnimating) return;
          if(!$(this).hasClass(self.settings.disabledClass)) {
            self.setSlide(currentSlide - self.settings.itemsPerSlide, true, true);
            isAnimating = true;
          }
        });
        $sliderNextBtn.on('click', function() {
          if (isAnimating) return;
          if(!$(this).hasClass(self.settings.disabledClass)) {
            self.setSlide(currentSlide + self.settings.itemsPerSlide, true, true);
            isAnimating = true;
          }
        });

        if (!self.settings.loop) {
          if (currentSlide === 0) {
            $sliderPrevBtn.addClass(self.settings.disabledClass);
          }
          if (currentSlide + self.settings.itemsPerSlide > slideCountTotal) {
            $sliderNextBtn.addClass(self.settings.disabledClass);
          }
        }
      } else {
        // Add disabled class for navigration arrows
        $sliderNav.addClass(self.settings.hiddenClass);
      }

      // Add handlers and init slider control navs
      if (self.settings.controlNavEnabled) {
        self.setControlNav();

        $sliderControlNav.on('click', $sliderControlNavItems, function(e) {
          self.setSlide($(e.target).index(), true, false);
        });
      } else {
        // Add disabled class for navigration dots
        $sliderControlNav.addClass(self.settings.hiddenClass);
      }

      // API: after callback
      $slider.on('transitionend', function() {
        isAnimating = false;
        self.settings.after(self);
      });

      // API: Initialize callback
      self.settings.init(self);
    };

    // Create dynamically dot items and append them to container
    this.setControlNav = function() {
      var buffer = []; // Container of all dot items that will be created later

      for (var i = 0; i < slideCount + 1; i++) {
        if (i === currentSlide) {
          // Make current item active from begin
          buffer.push('<div class="' + self.settings.controlNavItemSelector + ' ' + self.settings.activeClass + '"></div>');
        } else {
          buffer.push('<div class="' + self.settings.controlNavItemSelector + '"></div>');
        }
      }

      $sliderControlNav.empty().append(buffer.join(''));
      $sliderControlNavItems = $sliderControlNav.children();
    };

    // Recalculate all sizes, set needed things
    this.update = function() {
      $sliderItems = $sliderContainer.find(self.settings.itemSelector);
      slideCount = $sliderItems.length - 1;
      slideCountTotal = $sliderItems.length;

      setSizes();

      // if (currentSlide > slideCount) {
      if (currentSlide + self.settings.itemsPerSlide > slideCountTotal) {
        currentSlide = slideCountTotal - self.settings.itemsPerSlide;
      }

      if (slideCountTotal < self.settings.items) {
        currentSlide = 0;
      }

      self.setSlide(currentSlide, false, false);

      if (self.settings.controlNavEnabled) {
        self.setControlNav();
      }
    };

    // Main function that moves slides. Set slide by passed index as parameter
    this.setSlide = function(index, isAnimated, isDirectionNav) {
      // API: Before callback
      self.settings.before(self);

      self.stop();

      if (!isFirstLoad) {
        // If items are less then viewport - add disabled classes
        if (slideCountTotal > self.settings.items) {

          $sliderNavBtns.removeClass(self.settings.disabledClass);

          if (currentSlide - index < 0) {
            if (index === slideCountTotal && self.settings.loop) {
              index = 0;
            }
            if (index + self.settings.itemsPerSlide >= slideCountTotal) {
              index = slideCountTotal - self.settings.items;
              if (!self.settings.loop) {
                $sliderNextBtn.addClass(self.settings.disabledClass);
              }
            }

          } else {
            if (index + self.settings.itemsPerSlide === 0) {
              index = slideCountTotal - self.settings.items;
            }
            if (index <= 0) {
              index = 0;
              if (!self.settings.loop) {
                $sliderPrevBtn.addClass(self.settings.disabledClass);
              }
            }
          }

          // Replay possible animations in gif's
          if (self.settings.reloadGif) {
            $sliderItems.eq(index).find('img').each(function() {
              var $this = $(this);
              var currentUrl = $this.attr('src');

              $this.attr('src', '');
              $this.attr('src', currentUrl);
            });
          }

        } else {
          $sliderNavBtns.addClass(self.settings.disabledClass);
        }

      } else {
        // Disable contols if there are less items than viewport
        if (slideCountTotal < self.settings.items) {
          $sliderNavBtns.addClass(self.settings.disabledClass);
        }
      }

      // Set active new control nav item
      if (self.settings.controlNavEnabled && typeof $sliderControlNavItems !== 'undefined') {
        $sliderControlNavItems.removeClass(self.settings.activeClass);
        $sliderControlNavItems.eq(index).addClass(self.settings.activeClass);
      }

      // Apply CSS transition to block
      if (isAnimated) {
        $slider.css(transformPrefix, getTranslateX(-(index + self.settings.cloneItems) * slideWidth));
      } else {
        cssTransform[transitionPrefix] = 'none';
        cssTransform[transformPrefix] = getTranslateX(-(index + self.settings.cloneItems) * slideWidth);

        $slider.css(cssTransform);
        setTimeout(function() {
          $slider.css(transitionPrefix, '');
        }, 1);
      }

      currentSlide = index;

      isFirstLoad = false;
    };

    // Resize handler function
    this.resize = function() {
      $(window).resize(function() {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
          resizeTimeout = null;
        }
        resizeTimeout = setTimeout(function() {
          setSizes();
          self.setSlide(currentSlide, true, false);
        }, 250);
      });
    };

    this.destroy = function() {
      $sliderContainer.removeClass(self.settings.loadedClass);
      clearInterval(animateInterval);
    };

    this.play = function() {
      animateInterval = setInterval(function() {
        if ((slideCount + 1) !== self.settings.itemsPerSlide) {
          self.setSlide(currentSlide + self.settings.itemsPerSlide, true, true);
        }
        self.play();
      }, self.settings.interval);
    };

    this.stop = function() {
      clearInterval(animateInterval);
    };

    this.getCurrentSlideIndex = function() {
      return currentSlide;
    }

    // Finally init slider
    this.init();
  };

  $.fn.coreSlider = function(options) {
    if (options === undefined) {
      options = {};
    }

    if (typeof options === 'object') {
      return this.each(function() {
        new CoreSlider(this, options);
      });
    // Export public api
    } else {
      var $slider = $(this).data('coreslider');
      if(!$slider) {
        return;
      }

      switch(options) {
        case 'update': $slider.update(); break;
        case 'play': $slider.play(); break;
        case 'stop': $slider.stop(); break;
        case 'destroy': $slider.destroy(); break;
        case 'next': $slider.setSlide($slider.getCurrentSlideIndex() + 1, true, true); break;
        case 'prev': $slider.setSlide($slider.getCurrentSlideIndex() - 1, true, true); break;
        default:
          if (typeof options === "number") {
            $slider.setSlide(options, true, true);
          }
      }
    }
  }

}));
