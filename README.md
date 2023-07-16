# FwRuleBridge - A firewall rule set checker and modularized transformer

This tool was created as part of my master thesis and is used to transform firewall rulesets from Excel to Terraform-Code and vice versa. It's possible to extend the transformer by adding additional modules for other file-types or formats. Furthermore, this tool has several validators to check the ruleset for common issues like duplicated rules, unsecure rules and missing information.

*Commandline Usage:*  

```
# validate ruleset
fwrulebridge validate <inputModule> <input>

# transform ruleset (inludes validation)
fwrulebridge transform <inputModule> <input> <outputModule> <output>
```

*Example*  

```
# validate ruleset
fwrulebridge validate tsi_excel ruleset.xlsx

# transform ruleset (inludes validation)
fwrulebridge transform tsi_excel ./ruleset.xlsx tsi_terraform ./terraform_repo
```
