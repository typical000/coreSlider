(function($) {

  'use strict';

  $.simpleSlider = function(container, options){

    this.defaults = {
      interval: 5000, // Interval of time between slide changes
      loop: true, // When slider finish should it loop again from first slide?
      slideshow: true, // Enable/Disable automatic slideshow
      resize: true, // Should be slider responsive on screen resize
      pauseOnHover: true, // Pause the slideshow when hovering over slider
      startOnHover: false, // Start the slideshow when hovering over slider
      sliderSelector: '.core-slider_list',
      viewportSelector: '.core-slider_viewport',
      itemSelector: '.core-slider_item',
      navEnabled: true, // Enable/Disable navigation arrows
      navSelector: '.core-slider_nav', // Selector for navigation arrows container
      navItemNextSelector: '.core-slider_arrow__right', // 'Next' arrow selector
      navItemPrevSelector: '.core-slider_arrow__left', // 'Prev' arrow selector
      controlNavEnabled: false, // Enable/Disable control navigation (dots)
      controlNavSelector: '.core-slider_control-nav', // Control navigation container selector (inside will be created dots items)
      controlNavItemSelector: 'core-slider_control-nav-item', // Single control nav dot (created dynamically. Write without dot. If you need more that one class - add them with space separator)
      loadedClass: 'is-loaded', // Classname, that will be added when slider is fully loaded
      clonedClass: 'is-cloned', // Classname, that will be added to cloned slides (see option 'clone')
      disabledClass: 'is-disabled', // Classname, that will be added it item is disabled (in most of cases - item will be display: noned)
      activeClass: 'is-active', // Classname, that will be added to active items (for example control navs, etc.)
      reloadGif: false, // Reload gif's for replaying cycled animation in image
      clone: false, // Clone last 3 items of slider at the begin and at the end of slider
      items: 1, // How mutch items will be placed inside. Leave 1 if this is slider
      cloneItems: 0 // Huw mutch items will be cloned at begin and at end of slider
    };

    // Extend defaults with settings passed on init
    this.settings = $.extend({}, this.defaults, options);

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
        $sliderControlNav = $sliderContainer.find(self.settings.controlNavSelector),
        $sliderControlNavItems,
        slideCount = $sliderItems.length - 1,
        slideWidth, // Single slide width
        currentSlide = 0,
        transformPrefix = getVendorPrefixes(["transform", "msTransform", "MozTransform", "WebkitTransform"]),
        resizeTimeout,
        currentUrl = null,
        currentTags = null;

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

    // Initialization of slider
    this.init = function(){
      // Set inner container sizes
      $sliderContainer.addClass(self.settings.loadedClass);
      if(self.settings.clone) {
        // If clone is enabled - clone slides on end and on begin of slider
        self.cloneSlides();
      }
      self.setSizes();
      self.setSlide(currentSlide);
      if(self.settings.slideshow) {
        self.play();
      }
      if(self.settings.resize) {
        self.resize();
      }
      // Pause on hover events
      if(self.settings.pauseOnHover && self.settings.slideshow) {
        $sliderContainer.mouseenter(function(){
          self.stop();
        });
        $sliderContainer.mouseleave(function(){
          self.play();
        });
      }
      // Start on hover events
      if(self.settings.startOnHover && self.settings.slideshow) {
        $sliderContainer.mouseenter(function(){
          self.play();
        });
        $sliderContainer.mouseleave(function(){
          self.stop();
        });
      }

      // Add handlers for slider navs (prev/next)
      if(self.settings.navEnabled) {
        $sliderPrevBtn.on('click', function(){
          self.setSlide(--currentSlide);
        });
        $sliderNextBtn.on('click', function(){
          self.setSlide(++currentSlide);
        });
      } else {
        // Add disabled class for navigration arrows
        $sliderNav.addClass(self.settings.disabledClass);
      }

      // Add handlers and init slider control navs
      if(self.settings.controlNavEnabled) {
        // Create dynamically dot items and append them to container
        var buffer = []; // Container of all dot items that will be created later
        for(var i = 0; i < slideCount+1; i++) {
          if(i == currentSlide) {
            // Make current item active from begin
            buffer.push('<div class="' + self.settings.controlNavItemSelector + ' ' + self.settings.activeClass + '"></div>');
          } else {
            buffer.push('<div class="' + self.settings.controlNavItemSelector + '"></div>');
          }
        }
        $sliderControlNav.append(buffer.join(''));
        // Cache all items in variable
        $sliderControlNavItems = $sliderControlNav.children();
        // Add event handlers to container
        $sliderControlNav.on('click', $sliderControlNavItems, function(e){
          currentSlide = $(e.target).index();
          self.setSlide(currentSlide);
        });
      } else {
        // Add disabled class for navigration dots
        $sliderControlNav.addClass(self.settings.disabledClass);
      }
    };

    this.cloneSlides = function(){
      // Prepend first last items at begin of slider and first elements on end of slider
      $slider.append($sliderItems.slice(0, self.settings.cloneItems).clone().addClass(self.settings.clonedClass));
      $slider.prepend($sliderItems.slice(slideCount - self.settings.cloneItems + 1, slideCount + 1).clone().addClass(self.settings.clonedClass));
      // Cache cloned items in variable
      $clonedSliderItems = $sliderContainer.find(self.settings.itemSelector).filter('.' + self.settings.clonedClass);
    };

    // Function for setting sizes for each item in slider
    this.setSizes = function(){
      slideWidth = $sliderViewport.width() / self.settings.items;
      $sliderItems.add($clonedSliderItems).css('width', slideWidth);
      $slider.css('width', slideWidth * (slideCount + self.settings.items*2 + 1) * 1.3);
    };

    // Main function that moves slides. Set slide by passed index as parameter
    this.setSlide = function(index){
      self.stop();
      if(currentSlide > slideCount) {
        currentSlide = (self.settings.loop) ? 0 : currentSlide - 1;
      }
      if(currentSlide < 0) {
        currentSlide = (self.settings.loop) ? slideCount : 0;
      }
      // Replay possible animations in gif's
      if(self.settings.reloadGif) {
        currentTags = $sliderItems.eq(currentSlide).find('img');
        currentTags.each(function(){
          var $this = $(this);
          currentUrl = $this.attr('src');
          $this.attr('src', '');
          $this.attr('src', currentUrl);
        });
      }
      // Set active new control nav item
      if(self.settings.controlNavEnabled && typeof $sliderControlNavItems !== 'undefined') {
        $sliderControlNavItems.removeClass(self.settings.activeClass);
        $sliderControlNavItems.eq(currentSlide).addClass(self.settings.activeClass);
      }
      // Apply CSS transition to block
      $slider.css(transformPrefix, getTranslateX(-(currentSlide + self.settings.cloneItems) * slideWidth));
    };

    // Resize handler function
    this.resize = function(){
      $(window).resize(function(){
        if(resizeTimeout) {
          clearTimeout(resizeTimeout);
          resizeTimeout = null;
        }
        resizeTimeout = setTimeout(function(){
          self.setSizes();
          self.setSlide(currentSlide);
        }, 250);
      })
    };

    this.destroy = function(){
      $sliderContainer.removeClass(self.settings.loadedClass);
      clearInterval(animateInterval);
    };

    this.play = function(){
      animateInterval = setInterval(function(){
        currentSlide++;
        self.setSlide(currentSlide);
        self.play();
      }, self.settings.interval);
    }

    this.stop = function(){
      clearInterval(animateInterval);
    };

    // Finally init slider
    this.init();
  };

  $.fn.simpleSlider = function(options) {
    if (options === undefined) {
      options = {};
    }
    if (typeof options === 'object') {
      return this.each(function() {
        new $.simpleSlider(this, options);
      });
    }
  }

})(jQuery);
