### Inlang is not ready for use yet. Stay tuned, or get <a href="https://tally.so/r/3q4O59">notified</a>.
#


<div>
    <p align="center">
        <img width="40%" src="https://raw.githubusercontent.com/inlang/inlang/main/assets/logo-white-background.svg"/>
    </p>

</div>


<h2 align="center">
       A git-based software localization system
</h2> 

#

Inlang is a localization system that acknowledges git repositories as the single source of truth, utilizes CI/CD pipelines of repositories for automation, and extends git to close collaboration gaps between developers and translators. 


<p align="center">
    <img width="60%" src="https://raw.githubusercontent.com/inlang/inlang/rfc-001-architecture/rfcs/assets/001-git-based-architecture.png"   alt="Git-based     architecture">
    <br/>
    <small align="center">
        Inlang consits of developer tools, an editor for translators, and automation via existing CI/CD pipelines.     
    </small>
</p>

<small align="center">
  Inlang consits of developer tools, an editor for translators, and automation via existing CI/CD pipelines.     
</small>



Inlang works "on-top-of" the translation files in your repository so you keep full control of your data with no lock-in effect. Validated translations go right back to your git-repo where the rest of your code-base lives. No unnecessary data pipelines and integrations needed.

This leads to one single source of truth: your repository ✅

Useful features such as warnings for missing translations, or  immutable placeholders for variables are pleasant extras to the fundamental advantage of Inlang's git-based architecture.  

## Apps

> :bulb: The apps and features you see below are the features that are available right now. More is planned.


### [Editor](apps/dashboard)  
Let non-technical team members and translators manage translations for you.

![dashboard-example](https://user-images.githubusercontent.com/35429197/154271089-9acf02c3-7c6e-435c-9014-6ee21426ab4d.png)

> In-progress features:
> - In-editor rendering of your site/application so translators keep proper context of translations in mind.

### [VS-Code-Extension](apps/vs-code-extension)  
Improve developers' workflows by (semi)automating repetitive tasks. 

Extract and show patterns directly in your IDE. 


> :bulb: The VS Code extension works independently of the dashboard and CLI.


![Screen Recording 2022-02-15 at 15 02 26](https://user-images.githubusercontent.com/35429197/154270998-3e8d147a-b979-4df5-b6df-a53c900d962e.gif)

#
Many more features in the pipeline, stay up to date and get <a href="https://tally.so/r/3q4O59">notified</a> for new developments. 

If you want to deep-dive into the technical details; read this <a href="https://github.com/inlang/inlang/blob/rfc-001-architecture/rfcs/001-core-architecture.md">Architecture RFC</a> and let us know what you think. Any feedback is appreciated. 

## Community & Support

Community activity of any shape is appreciated.  

- [GitHub Discussions](https://github.com/inlang/inlang/discussions): feedback and questions.
- [GitHub Issues](https://github.com/inlang/inlang/issues): bugs you encounter using inlang.

