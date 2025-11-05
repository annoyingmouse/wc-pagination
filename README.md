# <wc-pagination>

This web component creates a mostly accessible (please see [note](#accessibility_note)) pagination element.

## Demo 

https://codepen.io/annoyingmouse/pen/YzOMYyv

## Usage

```html
<wc-pagination total="1000"
               current="1"
               page-size="15"></wc-pagination>
<script type="module" src="wc-pagination.js"></script>
```
## Configuration

The pagination relies on three attributes.

* The `total` number variable is the total number of records.
* The `current` number variable indicates the current page.
* The `page-size` number variable specifies the number of records per page.

## <a id="accessibility_note">Accessibility note</a>

Lots of accessibility features have been added recently, but I'm sure I'm missing some; please do get in touch with any issues you discover, as I'm hoping to make this as accessible as possible.

## License

MIT