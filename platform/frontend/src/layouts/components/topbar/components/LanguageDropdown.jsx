import { useState } from 'react';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap';
import flagES from '@/assets/images/flags/es.svg';
import flagUS from '@/assets/images/flags/us.svg';
const availableLanguages = [{
  code: 'en',
  name: 'English',
  nativeName: 'English',
  flag: flagUS
}, {
  code: 'es',
  name: 'Spanish',
  nativeName: 'Español',
  flag: flagES
}];
const LanguageDropdown = () => {
  const [language, setLanguage] = useState(availableLanguages[0]);
  return <div className="topbar-item">
      <Dropdown align="end">
        <DropdownToggle as={'button'} className="topbar-link fw-bold  drop-arrow-none">
          <img src={language.flag} alt="user-image" className="w-100 rounded" width="18" height="18" />
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          {availableLanguages.map(lang => <DropdownItem key={lang.code} title={lang.name} onClick={() => setLanguage(lang)}>
              <img src={lang.flag} alt="English" className="me-1 rounded" width="18" height="18" />
              <span className="align-middle">{lang.nativeName}</span>
            </DropdownItem>)}
        </DropdownMenu>
      </Dropdown>
    </div>;
};
export default LanguageDropdown;