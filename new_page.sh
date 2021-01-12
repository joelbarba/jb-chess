#!/usr/bin/env bash

echo "-----------------------------------------------------"
echo "          Add a new page to the app"
echo "-----------------------------------------------------"
echo ""
echo "Type the name of the new page (camelCase starting with lowercase):"
read ccName

CcName=`echo "$ccName" | sed -e "s/\b\(.\)/\u\1/g"`      # CcName = JbLabel     -> Camel Case starting with Uppercase
vName=`echo $ccName | sed -e 's/\([A-Z]\)/-\L\1/g'`      # vName  = jb-label    -> Hyphens all lowercase

ccNameComp=$CcName"Component"
moduleName=$CcName"Module"
routingFile="src/app/core/common/app-routing-config.ts"
moduleFile="src/app/pages/$vName/$vName.module.ts"

echo ""
echo "Select one option:"
echo " 1. New Page - New module with a full url /[newPage]"
echo " 2. Section Page - New page in an existing module, like /products/[newSection]"
read op
if [ "$op" = "2" ]; then
    echo ""
    echo "What is the existing folder of the page on /pages/[folder]?"
    read folderName
#    moduleFile=`ls src/app/pages/$folderName/*.module.ts`
#    if [ ! -z "$moduleFile" ]; then
#        moduleName=`tail -1 $moduleFile | cut -f3 -d' '`
#        echo "Looking into folder /pages/$folderName"
#        echo "MODULE FOUND = $moduleName"
#    fi
#    if [ -z "$moduleName" ]; then
#        cat src/app/core/common/app-routing-config.ts | grep 'loadChildren' | grep -o 'mod\..*),' | cut -c5- | rev | cut -c3- | rev
#        echo ""
#        echo "Module not found"
#        echo "Please select one (from 'app-routing-config.ts' mod.)"
#        read moduleName
#    fi
    echo ""
    echo "A new component is going to be created like:"
    echo "    ng generate component pages/$folderName/$vName -m=$folderName"
    echo ""
    echo " Is this ok?"
    read x
    ng generate component pages/$folderName/$vName -m=$folderName
    echo "Done!"
    exit 1
fi

echo ""
echo "A new module + default component is going to be created like:"
echo "    ng generate module pages/$vName"
echo "    ng generate component pages/$vName -m=$vName"
echo ""
echo " Is this ok?"
echo " Add it as a lazy loaded route? (Enter=Lazy Loaded, n=Static)"
read x

if [ "$x" = "n" ]; then  # NO LAZY LOAD

    ng generate module pages/$vName
    ng generate component pages/$vName -m=$vName

    # Add a new route to "app-routing.module.ts":"
    sed -i "1i import { $ccNameComp } from 'src/app/pages/$vName/$vName.component';" ${routingFile}

    newRoute="  { path: '$vName', component: $ccNameComp, data: { label: 'page.label.xxxxx', permission: 'xxxxx' } },"
    routeMark="]; \/\/ RouteEnd"
    sed -i "s/$routeMark/$newRoute\n$routeMark/" ${routingFile}

    # Export the component from the module to be accessible from the router
    sed -i "10i   , exports: [$ccNameComp]" src/app/pages/$vName/$vName.module.ts

else  # WITH LAZY LOAD
    echo " - New lazy loaded route ---> $vName"
    echo ""

    ng generate module pages/$vName
    ng generate component pages/$vName -m=$vName

    # Add a new route to "app-routing.module.ts":"
    newRoute="  { path: '$vName',\n"
    newRoute=$newRoute"    loadChildren: () => import('src\/app\/pages\/$vName\/$vName.module').then(mod => mod.$moduleName),\n"
    newRoute=$newRoute"    data: { label: 'page.label.xxxxx', permission: 'xxxxx' }\n  },\n"
    routeMark="]; \/\/ RouteEnd"
    sed -i "s/$routeMark/$newRoute\n$routeMark/" ${routingFile}

    # Export the component from the module and add the child route definition
    sed -i "4i import { RouterModule, Routes } from '@angular/router';" ${moduleFile}
    sed -i "6i const routes: Routes = [\n  { path: '', component: $ccNameComp }\n];\n" ${moduleFile}
    sed -i "13i RouterModule.forChild(routes)," ${moduleFile}
    # sed -i "16i , exports: [$ccNameComp]" ${moduleFile}
fi

echo "---- DONE ----"
echo ""
