# Nes Sprite Puller
This is a javascript based NES sprite puller. It will create canvas with a a 1 or 2 column sprite sheet representing all the non PRG data in the ROM. Colors can be changes to whatever you'd like, but defaults to a gameboy-esqu four color gray. This parses the sprite data based on the information found on the NES dev wiki for the [PPU Format](http://wiki.nesdev.com/w/index.php/PPU_pattern_tables) in ROMs using the [iNES format](http://wiki.nesdev.com/w/index.php/INES). Once the image is generated a download line will appear below. Exports are in PNG format.

If you would like to try it out finding those ROMs is on you for obvious reasons.

### Notes
Some games buy have large blank sections or area of their sprite sheet that appears to be garbage. This can be caused by various things, usually blank spaces are just that, blank spaces in the CHR data, and garbage is code or compressed graphics mixed in. Palettes are stored in different locations depending on the game, so pulling them out to automatically colorize is not possible with some slow brute-force style checking.

Occasionally you may find a ROM that does not load any information. There are two possibilities for this. First, that game does something unusual, in most cases this could probably be solved, but I tested only a small fraction of the titles for the system. The second possible failure point is if a game has an unusually large sprite sheet, which would cause the canvas that is created to be larger than the browser allows, making it unwritable. The current size/layout should avoid this but again, only a small fraction of total titles were tested.

In either case if you open a ticket I'll look into it and see about getting the specified title working. 

### Uses
This was created simply because I saw a video about NES development that mention that sprites were in an interesting binary format and I wanted to see if I could work with in strictly in JS (all non-javascript files in this project are simply there to make the JS presentable). The format is pretty interesting and efficient IMO, at least for the time. Outside of my own interest (and possibly others) it has no real use, as there are other applications for various systems that can read/write this data in more useful ways. While his could be modified to edit and write sprite data back into the ROM that is a project I'm not interested in undertaking at this time, maybe in the future.