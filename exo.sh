#!/bin/bash
echo "Entrez votre note :" 
read -p "une note " note 

if [ "$note" => 15 ]; then 
    echo "top" 
elif [ "$note" -ge 10 ]; then 
    echo "bien" 
elif [ "$note" -ge 5 ]; then 
    echo "pas ouf"  
else 
    echo "bof" 
fi
