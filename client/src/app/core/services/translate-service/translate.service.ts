import { Injectable } from '@angular/core';
import { Language } from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})

export class TranslationService {
  static instance: TranslationService;

  constructor(
    public readonly translateService: TranslateService,
    private readonly accountService: AccountService,
  ) {TranslationService.instance = this;}

  changeLang(lang?: Language) {
    const switchLang: Language = this.translateService.currentLang === Language.FR ? Language.EN : Language.FR;
    this.translateService.use(lang ?? switchLang);
    this.accountService.changeLang(lang ?? switchLang).subscribe((account) => {
      console.log(account)
      this.accountService.account = account;
    });
  }
}