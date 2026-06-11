# Week 1 — CK Builder Track
Date: June 11 2026

Summary
-------
Completed enums, strings, modules, and hashmaps in rustlings

What I completed
-----------------
- Rustlings exercises:
  - `08_move_semantics`
  - `09_strings`
  - `10_modules`
  - `11_hashmaps`

Key learnings
-------------
First ... damn the syntax is interesting. I'd say my favorite thing is the :: syntax e.g [here](https://github.com/officialcmg/CKBuilder/blob/08a1ee7a49283b20ebae1439cd841437a213b46d/rustlings/exercises/10_modules/modules3.rs#L6)
I also love pattern matching syntax
Like ...
```rust
match message {
    Message::Resize { width, height } => self.resize(width, height),
    Message::Move(point) => self.move_position(point),
    Message::Echo(s) => self.echo(s),
    Message::ChangeColor(r, g, b) => self.change_color(r, g, b),
    Message::Quit => self.quit(),
}
```
How can you not love that? lol

I know it's perfomant but also also looks nice

Also got to understand ownership and borrowing a bit better through the string exercises
