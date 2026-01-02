Parrot V2 beta 1: 

Open Questions: 
 - Goal of the parrot initiative? 
    -> usage of the lix sdk like in sherlock?
    -> 


Options: 
Replacing the sdk1 with the new one (in memory short living lix like sherlock) 2+ Weeks + testing

    -> open questions: 
    -> how do we deal with reactivity?
        -> paraglide is only one way
        -> fink 2.0 loads everything

        -> quick fix - keep a list of hashsed messages in memory, compare them every second and fire events (delte/update/insert)
            -> plugin key writes are expencive and lead to a blocking ui if we update 100 messages every second

    -> migration?
        -> do we load and save messages in v1 format (no migration needed)
          -> Load https://github.com/opral/inlang/blob/798dc07e2254015c7921debdf4dc5930bb2dc2a1/inlang/packages/parrot-figma/src/lib/message/store/InlangMessageStoreFigmaRoot.ts#L164-L165
          -> Save https://github.com/opral/inlang/blob/798dc07e2254015c7921debdf4dc5930bb2dc2a1/inlang/packages/parrot-figma/src/lib/message/store/InlangMessageStoreFigmaRoot.ts#L134
        -> we don't support variants until controls touched (no new features of v2 needed)
    
    -> Export 
        -> shall we update the ejs templates to the new message format (quick)
        -> write exporting plugin 

    -> Import 
        -> update importers to use v2 

    -> Settings - we can use the same approach as now 

Saving Sqlite 

    -> we loose the message reference in parrot for non opfs 
    -> even the same user will not see his messages when using figma in the browser vs figma app or different computer or 
    
Using the Editor component

    -> we can consider using the editor component in the message tap 
    -> We remove varios features (bold/italic)
    -> Styling will be different (first iteration would need ditch language/variant support) - 
    



    


   Usage of the sdk: 
    Exporter
    
    Export templates (injected into ejs via exporter)
        - androidXml   
        - appleDict
        - i18next
    
    MessageImporter 
        - getVariant used to detect diffs (JSON stringify)

    Importer
        - AndroidXml Importer
        - appleDict Importer
        - Apple Strings File Importer
    
    LocalizedLabel 
        - v1 message persisted, migration to v2

    LocalizedLabelManager / LocalizedLabelManagerUI 
        - v1 message is passed from main to ui
    
    MessageExtension 
        - used to extract the parameters from the variants into a structuref format
    
    InlangeMessageStoreFigmaRoot
        - reactivity - currenty messages are stored within the  current figma files root and changes are propagated into the ui
    
    MessageStoreMemory - ui counterpart to Root Message Store
        - initializes an InlangProject using a FigmaRootFs 
        - handles changes in RefLanguage etc comming from the ui

    Language Setup 
        - comunicates with the MessageStoreMemory and the underlying inlagn project
    
    MessageVarientItem
        - renders a message (Message tap and Design tap)
 


In-scope

* using inlang sdk v2


 -> 
saving to opfs via null origin iframe

 -> Big question how we deal 

Using editor component to support variants

 -> 

Out of scope

multiplayer e.g. how to share an inlang file across a figma project (requires debate on saving in figma file, or sync via host). That's for beta 2
...

Target date

End of January