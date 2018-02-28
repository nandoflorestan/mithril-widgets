===============
mithril-widgets
===============

These are widgets for mithril_ applications, using Bootstrap 4.

.. _mithril: https://mithril.js.org/
.. _Bootstrap: https://getbootstrap.com/docs/4.0/getting-started/introduction/

mithril_ is an excellent, minimal Javascript single page application
framework that is giving everybody else a lesson in YAGNI.

We are using the parts of ECMAScript 6 (ECMAScript 2015) that are
directly supported by the major browsers. Our widgets are classes.

Pull requests are extremely welcome! And advice is also appreciated,
because I am not a Javascript expert.


Current versions of dependencies
================================

- Bootstrap_ 4.0
- mithril_ 1.1.6


Brief description of the contents
=================================

- **Notification** is a class that represents a single message to be
  displayed to the user. Each instance may contain a title,
  a main content in either HTML or plain text, and a level such as
  "success", "info", "warning", "danger" etc.
- **Notifier** is a widget that allows you to enqueue Notifications and then
  **toasts** them on screen, one at a time. Appearance of the Notification
  should be animated in order to call the user's attention to it.
  The time each message stays on screen is computed automatically so
  you don't have to worry about it. The user can rewind the history and see
  each notification again. When inactive, this widget is supposed to be
  a gray, nondescript box containing only the word "Notifications",
  plus the history button, statically place in a corner of the screen --
  usually the top right. A final feature is, this idle "Notifications" text
  can be replaced with small status messages of the kind that should
  **not** call the user's attention, e. g. "Fetching data from server".
- **request** is a function that wraps m.request(). It transparently
  communicates with Notifier to set a status message while a request is
  in progress.
- **SearchBox** creates a search input with a "clear" button to the right.
  You can just add it to your page and then set on it an *onchange()*
  function to do stuff whenever the user presses Enter on the search box.
- **SimpleTable** displays a table.
- **SortedTable** displays a table which allows the user to click on each
  header to sort the rows by that column, ascending or descending.
- **UL** makes it easy to render an unordered list.
- **Option** creates an <option> inside a <select> dropdown.
- **NavMenu** creates an actual Bootstrap_ navigation menu from data representing a menu structure.
- **FormField** creates a Bootstrap_ form field, optionally with a label.
- **PhoneField** creates a "tel" input for phone numbers.
- **ContentEditable** creates in-place editable tags, but it is kind of
  just a stub right now. Of course, improving it is just a
  Simple Matter Of Programming...


Thinking about the future of mithril-widgets
============================================

The mithril_ community generally recommends usage of the Observer pattern for
interaction between components. The pattern is also known as
Publication/Subscription.

None of our use cases has needed that yet, but when it happens, we intend to
depend on a very small event library such as this:
https://github.com/scottcorgan/tiny-emitter/blob/3.0.0/tiny-emitter.js


TO DO
=====

- Observer pattern
- Add creation date to Notification and display it, very small
- Add more widgets
- Perhaps reorganize this set of global variables into one *mw* object? This
  would be to namespace them, since browsers STILL do not support ES6 imports.
- https://docs.npmjs.com/getting-started/creating-node-modules
