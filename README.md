
- A Bonus/Mystery/Multi Solver tool 


We want a single page application that allows you to solve mystery formulas.
A typical mystery formula gives you a number of inputs.
Typically in the form of    a,b,c or x,y 
And then a formula to fill in those values.
As this is all frontend we want to do this in a  modern javascript framework
So the MVP would be a page that allows you to create a formula 
First up we want to start by selecting the number of parameters.  So we want a pull down that list A-B, all the way till A-Z .  Depending on selecting the option we want to create 
a fresh form that list the full range of that selection so e.g A-E would give you 5 form fields.  Lets build first.

The values filled in by the user into that form will be used in the 2nd part of the 
page There we want a form that allows you to create the formula.

A typicall GC cordinate looks like this , N 51° 07.358 E 004° 26.906
so we want a form that has 17 parameters .   
As you can see there's a North and an East parameter .. these need to be able to be toggled North South and East West.
The others are numbers.  There are 2 options for the numbers.  Either the user fills in an actuall number.  Or the user fills in a mathematical formula 
The values filled into the 1st part of the form then will be used to calculate the final coordinate.
Which we want displayed on top of the page.

In a later phase we want this coordinate to be mapped on a map.

Optionally we want people to be able to fill in the GC code of this Cache.   
As for storing the data, right now the idea is to use the Bookmarks in Firefox  so that they can actually be shared by the user between browsers with 
no authentication.   So they can prep at home and still update values in the field.
Later versions of this will allow for people to log on to an app or web page , authenticate and have this stored centrally. This at some point will however have to come at a cost.

This allows us in the future to  update the coordinates on the GC site for us.



